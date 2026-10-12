"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  UploadCloud,
  ImageIcon,
  X,
  MessageSquare,
  Download,
  AlertCircle,
  FileImage,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SelfieCapturePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode: Live Camera vs Upload from Device / Gallery
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentShake, setConsentShake] = useState(false);

  // File upload state
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera unavailable or permission denied. You can upload a photo from your device instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const switchTab = (tab: "camera" | "upload") => {
    setActiveTab(tab);
    if (tab === "upload") {
      stopCamera();
    }
  };

  const handleCapture = async () => {
    if (!consentGiven) {
      triggerConsentAlert();
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPreview(base64Data);
    stopCamera();

    await performSearch(base64Data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setUploadedFilePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setUploadedFilePreview(b64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchWithUploadedPhoto = async () => {
    if (!consentGiven) {
      triggerConsentAlert();
      return;
    }
    if (!uploadedFilePreview) return;

    setCapturedPreview(uploadedFilePreview);
    await performSearch(uploadedFilePreview);
  };

  const triggerConsentAlert = () => {
    setConsentShake(true);
    setTimeout(() => setConsentShake(false), 2000);
  };

  const performSearch = async (base64Image: string) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append("selfie_base64", base64Image);
      formData.append("consent", "true");

      const res = await api.selfieSearch(slug, formData);
      setSearchResult(res);
    } catch (err: any) {
      setSearchResult({
        matched_count: 0,
        photos: [],
        message: err.message || "Failed to search photos.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setSearchResult(null);
    setUploadedFilePreview(null);
    if (activeTab === "camera") {
      startCamera();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] text-[#1A120B] py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-amber-400/20 via-rose-300/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-rise">
        {/* Back Link */}
        <Link
          href={`/e/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-800 hover:text-amber-950 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/60 mb-6 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Gallery</span>
        </Link>

        {/* Viewfinder Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-950/5 text-center">
          {!searchResult && (
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                AI Facial Recognition
              </span>
              <h1 className="font-heading font-bold text-3xl text-[#1A120B] tracking-tight">
                Find Your Moments
              </h1>
              <p className="text-xs text-[#786E65] mt-1 leading-relaxed">
                Take a selfie or choose a photo. Our ArcFace 512-dim engine finds every frame you appear in within 50ms.
              </p>
            </div>
          )}

          {/* Mode Switch Tabs (Camera vs Upload) */}
          {!capturedPreview && !searchResult && (
            <div className="flex p-1 bg-amber-50/80 rounded-2xl border border-amber-200/80 mb-5">
              <button
                type="button"
                onClick={() => switchTab("camera")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "camera"
                    ? "bg-white text-amber-950 shadow-sm border border-amber-200/60 font-bold"
                    : "text-[#786E65] hover:text-[#1A120B]"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("upload")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "upload"
                    ? "bg-white text-amber-950 shadow-sm border border-amber-200/60 font-bold"
                    : "text-[#786E65] hover:text-[#1A120B]"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
            </div>
          )}

          {/* CAMERA MODE VIEWFINDER */}
          {!capturedPreview && !searchResult && activeTab === "camera" && (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#14100C] flex items-center justify-center mb-5 shadow-inner border border-amber-300/40">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Face Oval Guideline */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-64 border-2 border-amber-400/80 border-dashed rounded-[50%] shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse" />
                  </div>
                </>
              ) : (
                <div className="p-6 text-white text-center">
                  <Camera className="w-12 h-12 text-amber-400/60 mx-auto mb-3" />
                  <p className="text-xs text-stone-300 mb-3">{cameraError || "Initializing camera..."}</p>
                  <button
                    type="button"
                    onClick={() => switchTab("upload")}
                    className="text-xs text-amber-300 underline font-semibold hover:text-amber-200"
                  >
                    Switch to photo upload instead
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* UPLOAD MODE DROPZONE & PREVIEW */}
          {!capturedPreview && !searchResult && activeTab === "upload" && (
            <div className="mb-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadedFilePreview ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-amber-50 border-2 border-amber-300 shadow-sm flex items-center justify-center group">
                  <img
                    src={uploadedFilePreview}
                    alt="Selected photo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
                    title="Remove and choose another photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-white bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full backdrop-blur-xs transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${
                    isDragging
                      ? "border-amber-600 bg-amber-100/50 scale-[0.99]"
                      : "border-amber-300 bg-amber-50/50 hover:bg-amber-100/40 hover:border-amber-400"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-sm text-[#1A120B]">
                    Choose a Photo from Device
                  </h3>
                  <p className="text-[11px] text-[#786E65] mt-1 max-w-[220px] leading-relaxed">
                    Click to browse or drag and drop a selfie/photo containing your face
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white text-amber-800 border border-amber-200 shadow-2xs">
                    <FileImage className="w-3 h-3 text-amber-600" />
                    JPG, PNG, WebP or HEIC
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SCANNING ANIMATION */}
          {isScanning && (
            <div className="py-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-600 animate-spin" />
                <div className="absolute inset-3 rounded-full overflow-hidden bg-amber-50 border border-amber-300">
                  {capturedPreview && (
                    <img src={capturedPreview} alt="Selfie" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <h3 className="font-heading font-bold text-2xl text-[#1A120B]">
                Scanning Event Photos...
              </h3>
              <p className="text-xs text-[#786E65] mt-1.5 font-mono">
                Executing 512-dim ArcFace vector search across gallery.
              </p>
            </div>
          )}

          {/* CONTROLS & CONSENT */}
          {!capturedPreview && !isScanning && (
            <div className="space-y-4 text-left">
              {/* DPDP Consent */}
              <label
                className={`flex items-start gap-2.5 cursor-pointer p-3.5 rounded-2xl transition-all border ${
                  consentShake
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/30"
                    : "bg-amber-50/60 border-amber-200/80 hover:border-amber-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    if (e.target.checked) setConsentShake(false);
                  }}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-[11px] text-[#5A4F44] leading-snug">
                  I consent to temporary biometric facial embedding extraction solely for photo retrieval. Data is automatically destroyed in accordance with India&apos;s DPDP Act 2023.
                </span>
              </label>

              {/* Action Button: Live Capture OR Search with Uploaded Photo */}
              {activeTab === "camera" && cameraActive && (
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:shadow-xl hover:shadow-amber-600/30 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/15 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Selfie &amp; Search</span>
                </button>
              )}

              {activeTab === "upload" && (
                <button
                  type="button"
                  onClick={handleSearchWithUploadedPhoto}
                  disabled={!uploadedFilePreview}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:shadow-xl hover:shadow-amber-600/30 disabled:opacity-50 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/15 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{uploadedFilePreview ? "Search with this Photo" : "Select a Photo First"}</span>
                </button>
              )}
            </div>
          )}

          {/* RESULTS VIEW */}
          {searchResult && !isScanning && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
                <div className="text-left">
                  <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider block">
                    Search Complete
                  </span>
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#1A120B]">
                    {searchResult.message}
                  </h2>
                </div>
                <button
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors border border-amber-200 shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Another Photo</span>
                </button>
              </div>

              {searchResult.photos.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-[#786E65] mb-5 leading-relaxed">
                    No matching photos found in this batch yet. Photos are being uploaded throughout the event. Register your WhatsApp below to be notified automatically!
                  </p>
                  <Link
                    href={`/e/${slug}/optin`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Get WhatsApp Alerts</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {searchResult.photos.map((photo: any) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-amber-50/40 cursor-pointer border border-amber-200/60 shadow-sm hover:scale-[1.02] transition-transform"
                    >
                      <img
                        src={photo.thumb_url}
                        alt="Matched photo"
                        className="w-full h-full object-cover"
                      />
                      {photo.similarity && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow-sm">
                          {Math.round(photo.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] relative flex flex-col items-center">
            <img
              src={selectedPhoto.web_url || selectedPhoto.thumb_url}
              alt="Full size match"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4">
              <a
                href={selectedPhoto.web_url || selectedPhoto.thumb_url}
                target="_blank"
                download="eventlens-photo.jpg"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#1A120B] font-medium text-sm hover:bg-gray-100 transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Save High-Res Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
