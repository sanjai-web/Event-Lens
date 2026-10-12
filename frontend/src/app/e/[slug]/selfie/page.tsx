"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  X,
  MessageSquare,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SelfieCapturePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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
      setCameraError("Camera permission denied or not found. You can upload a selfie directly from your device instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!consentGiven) {
      alert("Please accept the biometric privacy consent before continuing.");
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

    // Perform face search
    await performSearch(base64Data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!consentGiven) {
      alert("Please accept the biometric privacy consent checkbox before selecting a photo.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const b64 = event.target?.result as string;
      setCapturedPreview(b64);
      stopCamera();
      await performSearch(b64);
    };
    reader.readAsDataURL(file);
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
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] text-[#1A120B] py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-amber-400/20 via-rose-300/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-rise">
        {/* Back Link */}
        <Link
          href={`/e/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-800 hover:text-amber-950 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/60 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Gallery</span>
        </Link>

        {/* Viewfinder Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-950/5 text-center">
          {!searchResult && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                AI Facial Recognition
              </span>
              <h1 className="font-heading font-bold text-3xl text-[#1A120B] tracking-tight">
                Find Your Moments
              </h1>
              <p className="text-xs text-[#786E65] mt-1 leading-relaxed">
                Take a quick selfie. Our ArcFace 512-dim engine finds every frame you appear in within 50ms.
              </p>
            </div>
          )}

          {/* Camera Viewfinder */}
          {!capturedPreview && !searchResult && (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#14100C] flex items-center justify-center mb-6 shadow-inner border border-amber-300/40">
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
                  <p className="text-xs text-stone-300">{cameraError || "Initializing camera..."}</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Scanning Animation */}
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

          {/* Camera Controls & Consent */}
          {!capturedPreview && !isScanning && (
            <div className="space-y-4">
              {/* DPDP Consent */}
              <label className="flex items-start gap-2.5 text-left cursor-pointer p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px] text-[#5A4F44] leading-snug">
                  I consent to temporary biometric facial embedding extraction solely for photo retrieval. Data is automatically destroyed in accordance with India&apos;s DPDP Act 2023.
                </span>
              </label>

              {cameraActive ? (
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!consentGiven}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:shadow-xl hover:shadow-amber-600/30 disabled:opacity-50 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/15"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Selfie &amp; Search</span>
                </button>
              ) : null}

              {/* Upload alternative */}
              <div className="pt-2 border-t border-amber-100">
                <label className={`text-xs font-semibold ${consentGiven ? "text-amber-800 hover:text-amber-950 cursor-pointer" : "text-stone-400 cursor-not-allowed"} block py-1`}>
                  <span>Or upload a photo from your gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!consentGiven}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Results View */}
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors border border-amber-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
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
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
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
