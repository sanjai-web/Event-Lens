import numpy as np
import io
import os
import logging
import cv2
from PIL import Image, ImageOps
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard 112x112 canonical reference landmarks for ArcFace Umeyama similarity transform
# Order: [left_eye, right_eye, nose, left_mouth_corner, right_mouth_corner]
REFERENCE_LANDMARKS = np.array([
    [38.2946, 51.6963],  # viewer left eye
    [73.5318, 51.5014],  # viewer right eye
    [56.0252, 71.7366],  # nose tip
    [41.5493, 92.3655],  # viewer left mouth corner
    [70.7299, 92.2041],  # viewer right mouth corner
], dtype=np.float32)


def umeyama_alignment(src: np.ndarray, dst: np.ndarray = REFERENCE_LANDMARKS) -> np.ndarray:
    """
    Computes optimal 2D similarity transform (rotation + uniform scale + translation)
    from source 5 landmarks to canonical ArcFace reference landmarks via Umeyama SVD.
    Returns 2x3 affine matrix for cv2.warpAffine.
    """
    num = src.shape[0]
    dim = src.shape[1]
    src_mean = src.mean(axis=0)
    dst_mean = dst.mean(axis=0)
    src_demean = src - src_mean
    dst_demean = dst - dst_mean

    A = np.dot(dst_demean.T, src_demean) / num
    d = np.ones(dim, dtype=np.float64)
    if np.linalg.det(A) < 0:
        d[dim - 1] = -1

    T = np.eye(dim + 1, dtype=np.float64)
    U, S, V = np.linalg.svd(A)
    rank = np.linalg.matrix_rank(A)

    if rank == 0:
        return np.nan
    elif rank == dim - 1:
        if np.linalg.det(U) * np.linalg.det(V) < 0:
            T[:dim, :dim] = np.dot(U, np.dot(np.diag([1, -1]), V))
        else:
            T[:dim, :dim] = np.dot(U, V)
    else:
        T[:dim, :dim] = np.dot(U, np.dot(np.diag(d), V))

    var = src_demean.var(axis=0).sum()
    if var == 0:
        return np.nan

    scale = 1.0 / var * np.dot(S, d)
    T[:dim, :dim] *= scale
    T[:dim, dim] = dst_mean - np.dot(T[:dim, :dim], src_mean)
    return T[:2, :]


def decode_image_upright(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Decodes image bytes ensuring EXIF orientation metadata is honored.
    Prevents vertical phone selfies or camera photos from appearing rotated sideways.
    Returns BGR numpy array compatible with OpenCV.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as pil_img:
            # ImageOps.exif_transpose reads EXIF orientation and rotates pixels to true upright
            pil_img = ImageOps.exif_transpose(pil_img).convert("RGB")
            rgb_arr = np.array(pil_img)
            return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
    except Exception as e:
        logger.debug(f"PIL decode fallback to cv2.imdecode: {e}")
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            return None


class FaceRecognitionService:
    def __init__(self):
        self.model_version = settings.FACE_MODEL_VERSION
        self.similarity_threshold = settings.FACE_SIMILARITY_THRESHOLD
        self.weights_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "weights")
        self.yunet_path = os.path.join(self.weights_dir, "face_detection_yunet_2023mar.onnx")
        self.arcface_path = os.path.join(self.weights_dir, "eventlens_arcface_v1.onnx")

        self.models_loaded = False
        self.detector = None
        self.arcface_session = None
        self._init_models()

    def _init_models(self):
        """Initializes OpenCV YuNet face detector and InsightFace ArcFace ONNX inference session."""
        try:
            os.makedirs(self.weights_dir, exist_ok=True)
            import urllib.request

            # 1. Ensure YuNet weights are present
            if not os.path.exists(self.yunet_path) or os.path.getsize(self.yunet_path) < 100000:
                logger.info("Downloading YuNet face detector model...")
                yunet_url = "https://raw.githubusercontent.com/opencv/opencv_zoo/master/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
                req = urllib.request.Request(yunet_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as resp, open(self.yunet_path, "wb") as f:
                    f.write(resp.read())

            # 2. Ensure ArcFace weights are present
            if not os.path.exists(self.arcface_path) or os.path.getsize(self.arcface_path) < 100000000:
                logger.info("Downloading ArcFace ResNet-50 512-dim model...")
                arcface_url = "https://huggingface.co/public-data/insightface/resolve/main/models/buffalo_l/w600k_r50.onnx"
                req = urllib.request.Request(arcface_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as resp, open(self.arcface_path, "wb") as f:
                    f.write(resp.read())

            if os.path.exists(self.yunet_path) and os.path.exists(self.arcface_path):
                import onnxruntime as ort
                self.detector = cv2.FaceDetectorYN.create(
                    self.yunet_path,
                    "",
                    (320, 320),
                    score_threshold=0.50,
                    nms_threshold=0.3,
                    top_k=5000
                )
                self.arcface_session = ort.InferenceSession(
                    self.arcface_path,
                    providers=["CPUExecutionProvider"]
                )
                self.models_loaded = True
                logger.info("ArcFace ResNet-50 and YuNet models initialized successfully.")
            else:
                logger.warning(f"Model weights could not be loaded from {self.weights_dir}.")
                self.models_loaded = False
        except Exception as e:
            logger.error(f"Failed to initialize neural network models: {e}")
            self.models_loaded = False

    @staticmethod
    def l2_normalize(vector: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector
        return vector / norm

    @staticmethod
    def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
        """Returns cosine similarity between two L2-normalized vectors (range -1.0 to 1.0)."""
        return float(np.dot(v1, v2))

    @staticmethod
    def align_face_112(img_bgr: np.ndarray, landmarks_5: np.ndarray) -> np.ndarray:
        """Aligns and crops face to canonical 112x112 ArcFace format using analytical Umeyama transform."""
        src = np.array(landmarks_5, dtype=np.float32).reshape(5, 2)
        M = umeyama_alignment(src, REFERENCE_LANDMARKS)
        if M is None or np.isnan(M).any():
            # Fallback to cv2.estimateAffinePartial2D or resize
            M, _ = cv2.estimateAffinePartial2D(src, REFERENCE_LANDMARKS)
            if M is None:
                return cv2.resize(img_bgr, (112, 112))
        aligned = cv2.warpAffine(img_bgr, M, (112, 112), borderValue=0.0)
        return aligned

    def _extract_arcface_embedding(self, aligned_bgr_112: np.ndarray) -> List[float]:
        """
        Runs 112x112 aligned face through ArcFace ResNet50 to produce a 512-dim normalized vector.
        Standard InsightFace preprocessing:
        - RGB color format (swapRB=True)
        - Normalization: (pixel - 127.5) / 127.5
        - Tensor shape: (1, 3, 112, 112)
        """
        blob = cv2.dnn.blobFromImage(
            aligned_bgr_112,
            scalefactor=1.0 / 127.5,
            size=(112, 112),
            mean=(127.5, 127.5, 127.5),
            swapRB=True  # InsightFace ResNet50 is trained on RGB!
        )
        input_name = self.arcface_session.get_inputs()[0].name
        raw_feat = self.arcface_session.run(None, {input_name: blob})[0].flatten()
        norm_feat = self.l2_normalize(raw_feat)
        return norm_feat.tolist()

    def detect_raw_faces(self, img_bgr: np.ndarray) -> Tuple[List[Any], float]:
        """
        Detects faces in img_bgr using YuNet at consistent 1280px detection scale.
        Returns: (faces, scale)
        """
        orig_h, orig_w = img_bgr.shape[:2]
        scale = 1.0
        max_dim = max(orig_w, orig_h)
        if max_dim > 1280:
            scale = 1280.0 / max_dim
            detect_img = cv2.resize(img_bgr, (int(orig_w * scale), int(orig_h * scale)))
        else:
            detect_img = img_bgr

        det_h, det_w = detect_img.shape[:2]
        self.detector.setInputSize((det_w, det_h))
        self.detector.setScoreThreshold(0.50)
        _, faces = self.detector.detect(detect_img)

        # Fallback pass with lower threshold if no faces were caught
        if faces is None or len(faces) == 0:
            self.detector.setScoreThreshold(0.35)
            _, faces = self.detector.detect(detect_img)
            self.detector.setScoreThreshold(0.50)

        if faces is None:
            return [], scale
        return list(faces), scale

    def process_image_faces(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Detects all faces in an event photo and extracts 512-dim ArcFace embeddings for each face.
        Returns: [{"embedding": [...512 floats...], "bbox": {...}, "landmarks": [...]}, ...]
        """
        if not self.models_loaded:
            self._init_models()
            if not self.models_loaded:
                return []

        try:
            img = decode_image_upright(image_bytes)
            if img is None:
                return []

            faces, scale = self.detect_raw_faces(img)
            if not faces:
                return []

            results = []
            for face in faces:
                conf = float(face[-1])
                x, y, w, h = face[0:4] / scale
                landmarks_coords = (face[4:14] / scale).reshape(5, 2)

                # Ignore tiny background noise (< 20px)
                if w < 20 or h < 20:
                    continue

                aligned = self.align_face_112(img, landmarks_coords)
                embedding = self._extract_arcface_embedding(aligned)

                results.append({
                    "embedding": embedding,
                    "bbox": {
                        "x": int(max(0, x)),
                        "y": int(max(0, y)),
                        "w": int(w),
                        "h": int(h),
                        "confidence": round(conf, 3),
                    },
                    "landmarks": {
                        "left_eye": [float(landmarks_coords[0][0]), float(landmarks_coords[0][1])],
                        "right_eye": [float(landmarks_coords[1][0]), float(landmarks_coords[1][1])],
                        "nose": [float(landmarks_coords[2][0]), float(landmarks_coords[2][1])],
                        "left_mouth": [float(landmarks_coords[3][0]), float(landmarks_coords[3][1])],
                        "right_mouth": [float(landmarks_coords[4][0]), float(landmarks_coords[4][1])],
                    }
                })

            return results
        except Exception as e:
            logger.error(f"Error in process_image_faces: {e}", exc_info=True)
            return []

    def process_single_selfie(self, image_bytes: bytes) -> Tuple[bool, Optional[List[float]], str]:
        """
        Processes a guest selfie:
        - Ensures true upright EXIF orientation.
        - Detects faces at 1280px standard scale.
        - Intelligent face scoring (confidence * sqrt(area)) avoiding border artifacts.
        - Umeyama alignment to 112x112 canonical ArcFace.
        - Returns: (success, 512-dim embedding, message)
        """
        if not self.models_loaded:
            self._init_models()
            if not self.models_loaded:
                return False, None, "Face recognition models are initializing. Please try again in a moment."

        try:
            img = decode_image_upright(image_bytes)
            if img is None:
                return False, None, "Invalid image format. Please upload a clear JPG or PNG photo."

            orig_h, orig_w = img.shape[:2]
            if orig_w < 60 or orig_h < 60:
                return False, None, "Photo resolution is too low. Please upload a clearer photo."

            faces, scale = self.detect_raw_faces(img)
            if not faces:
                return False, None, "No face detected. Please ensure your face is well-lit, centered, and looking at the camera."

            # Rank faces to select the primary face
            # Filter out non-face aspect ratios (w/h < 0.4 or w/h > 1.6) and border artifacts
            scored_faces = []
            for face in faces:
                conf = float(face[-1])
                x, y, w, h = face[0:4] / scale
                aspect = w / max(h, 1)

                if aspect < 0.35 or aspect > 1.7:
                    continue

                # Discount edge artifacts touching boundary with lower confidence
                if (x < 5 or y < 5) and conf < 0.80:
                    continue

                # Score combines high confidence and prominent size
                score = conf * np.sqrt(w * h)
                scored_faces.append((score, face))

            if not scored_faces:
                # Fallback: take highest confidence face
                scored_faces = [(float(f[-1]) * np.sqrt((f[2]/scale) * (f[3]/scale)), f) for f in faces]

            scored_faces.sort(key=lambda s: s[0], reverse=True)
            chosen_face = scored_faces[0][1]

            landmarks_coords = (chosen_face[4:14] / scale).reshape(5, 2)
            aligned = self.align_face_112(img, landmarks_coords)
            embedding = self._extract_arcface_embedding(aligned)

            return True, embedding, "Face detected and matched successfully."
        except Exception as e:
            logger.error(f"Error processing selfie: {e}", exc_info=True)
            return False, None, f"Could not process photo: {str(e)}"


face_service = FaceRecognitionService()
