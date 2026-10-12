"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  ArrowLeft,
  Upload,
  QrCode,
  ExternalLink,
  Users,
  Image as ImageIcon,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Download,
  Clock,
  RefreshCw,
  Check,
  ChevronRight,
  Copy,
  Share2,
  Trash2,
  Maximize2,
  Sparkles,
  Calendar,
  X,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMb, formatDate, getStatusBadge } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<"all" | "faces" | "pending">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMe().then(setProfile).catch(() => {});
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const [ev, photoList] = await Promise.all([
        api.getEvent(eventId),
        api.listPhotos(eventId),
      ]);
      setEvent(ev);
      setPhotos(photoList);
    } catch (err: any) {
      if (err.status === 401) {
        router.push("/login");
      } else {
        setError(err.message || "Failed to load event.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!event) return;
    const url = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!event) return;
    const url = `${window.location.origin}/e/${event.slug}`;
    const text = `Namaste! Here is your official AI Photo Gallery for *${event.name}*:\n🔗 ${url}\n\nGuests can scan the table QR code or upload a quick selfie to get every photo they appear in instantly!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleToggleStatus = async () => {
    if (!event) return;
    const newStatus = event.status === "live" ? "completed" : "live";
    try {
      const updated = await api.updateEvent(eventId, { status: newStatus });
      setEvent(updated);
      setSuccessMsg(`Event status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update event status.");
    }
  };

  const handleRenewRetention = async () => {
    try {
      await api.renewEvent(eventId, 30);
      setSuccessMsg("Event storage retention extended by +30 Days!");
      setTimeout(() => setSuccessMsg(null), 3500);
      loadEventDetails();
    } catch (err: any) {
      setError(err.message || "Failed to extend retention.");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo from the gallery?")) return;
    try {
      setDeletingPhotoId(photoId);
      await api.deletePhoto(eventId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      setSuccessMsg("Photo deleted successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete photo.");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const fileList = Array.from(files);
      const presignPayload = fileList.map((f) => ({
        filename: f.name,
        size_bytes: f.size,
        content_type: f.type || "image/jpeg",
      }));

      const presignRes = await api.presignUpload(eventId, presignPayload);
      setUploadProgress(30);

      const confirmedList = [];
      const totalFiles = fileList.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = fileList[i];
        const presignItem = presignRes.items[i];

        await fetch(presignItem.presigned_put_url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "image/jpeg",
          },
          body: file,
        });

        confirmedList.push({
          photo_id: presignItem.photo_id,
          r2_key_original: presignItem.r2_key_original,
          original_filename: file.name,
          file_size_bytes: file.size,
          width: 1920,
          height: 1080,
        });

        setUploadProgress(30 + Math.round(((i + 1) / totalFiles) * 55));
      }

      await api.confirmUpload(eventId, confirmedList);
      setUploadProgress(100);
      setSuccessMsg(`Successfully uploaded ${totalFiles} photos! Facial recognition is indexing.`);
      setTimeout(() => setSuccessMsg(null), 4000);

      await loadEventDetails();
    } catch (err: any) {
      setError(err.message || "Failed to upload photos.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (photoFilter === "faces") return p.face_count > 0;
    if (photoFilter === "pending") return !p.face_processed;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-200 border-t-amber-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6B5E52] font-medium font-mono">Loading event shoot...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center border border-amber-200/80 shadow-md">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-xl text-[#1A120B]">Event Not Found</h2>
          <p className="text-xs text-[#6B5E52] mt-1 mb-6">
            The requested shoot could not be located or has been archived.
          </p>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 text-white text-xs font-semibold shadow-xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(event.status);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A120B] flex flex-col lg:flex-row antialiased">
      {/* Left Sidebar */}
      <Sidebar
        profile={profile}
        storageUsedMb={event.storage_used_mb || 0}
        storageLimitMb={event.storage_limit_mb || 25000}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 w-full flex-1">
          {/* Top Breadcrumbs & Portals Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs text-[#786E65]">
              <Link href="/dashboard" className="hover:text-[#1A120B] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-[#1A120B] truncate max-w-[200px]">
                {event.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Toggle Live / Completed */}
              <button
                onClick={handleToggleStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200/80 text-xs font-medium text-[#1A120B] hover:bg-amber-50 shadow-2xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Mark as {event.status === "live" ? "Completed" : "Live"}</span>
              </button>

              {/* View Guest Gallery */}
              <Link
                href={`/e/${event.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-amber-200/80 text-[#1A120B] hover:bg-amber-50 text-xs font-medium transition-colors shadow-2xs"
              >
                <span>View Guest Gallery</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              </Link>

              {/* Test Selfie Face Search */}
              <Link
                href={`/e/${event.slug}/selfie`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white text-xs font-medium shadow-xs hover:scale-[1.02] transition-transform"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Test Face Search</span>
              </Link>
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Hero Shoot Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100/90 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-amber-100/70">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                      event.status === "live"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-900 border border-amber-200/70"
                    }`}
                  >
                    {event.status === "live" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {badge.label}
                  </span>
                  <span className="text-xs text-[#786E65] font-mono">
                    {formatDate(event.event_date)}
                  </span>
                </div>

                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A120B] tracking-tight">
                  {event.name}
                </h1>

                {/* Public Link Command Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6B5E52]">
                  <span className="font-semibold text-[#1A120B]">Guest Link:</span>
                  <span className="font-mono text-[#1A120B] bg-[#FAF8F5] px-3 py-1 rounded-xl border border-amber-200/70 select-all">
                    https://eventlens.in/e/{event.slug}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200/80 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-700" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Table QR Kit Card with Direct Download */}
              {event.qr_code_url && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-amber-200/80 shrink-0 shadow-2xs">
                  <img
                    src={event.qr_code_url}
                    alt="Event QR"
                    className="w-18 h-18 rounded-xl bg-white border border-amber-200 p-1 shadow-2xs object-contain"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1A120B] block">
                      Table QR Tent Card
                    </span>
                    <span className="text-[11px] text-[#786E65] block mb-2">
                      High-res print-ready QR
                    </span>
                    <a
                      href={event.qr_code_url}
                      download={`${event.slug}-table-qr.png`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white text-xs font-semibold transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 4 Stats Telemetry Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-amber-100/80">
                <span className="text-[11px] font-semibold text-[#8A7E73] uppercase tracking-wider block font-mono">
                  Total Photos
                </span>
                <div className="font-heading text-2xl sm:text-3xl text-[#1A120B] font-bold mt-1">
                  {(event.photo_count || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-amber-100/80">
                <span className="text-[11px] font-semibold text-[#8A7E73] uppercase tracking-wider block font-mono">
                  Guest Matches
                </span>
                <div className="font-heading text-2xl sm:text-3xl text-emerald-800 font-bold mt-1">
                  {(event.guest_count || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-amber-100/80">
                <span className="text-[11px] font-semibold text-[#8A7E73] uppercase tracking-wider block font-mono">
                  Cloud Storage Used
                </span>
                <div className="font-heading text-2xl sm:text-3xl text-[#1A120B] font-bold mt-1">
                  {formatMb(event.storage_used_mb || 0)}
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-amber-100/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8A7E73] uppercase tracking-wider block font-mono">
                    Retention Quota
                  </span>
                  <button
                    onClick={handleRenewRetention}
                    title="Extend retention timer by +30 Days"
                    className="text-[10px] text-amber-800 hover:text-amber-900 font-semibold underline"
                  >
                    +30 Days
                  </button>
                </div>
                <div className="font-heading text-2xl sm:text-3xl text-[#1A120B] font-bold mt-1">
                  {formatMb(Math.max(0, event.storage_limit_mb - (event.storage_used_mb || 0)))} free
                </div>
              </div>
            </div>
          </div>

          {/* High Speed Direct-to-R2 Photo Uploader Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100/90 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-heading font-bold text-xl text-[#1A120B]">
                  Direct-to-R2 High-Speed Uploader
                </h2>
                <p className="text-xs text-[#6B5E52] mt-0.5">
                  Upload raw camera batch exports. Files stream straight to Cloudflare R2 with zero latency.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-amber-800/20 transition-all shrink-0 hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? "Uploading Batch..." : "Upload Photos"}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex justify-between text-xs font-semibold text-amber-950 mb-1.5">
                  <span>Streaming batch photos to Cloudflare R2...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-amber-600 bg-amber-50/80 scale-[1.01]"
                  : "border-amber-200/80 hover:border-amber-400 bg-[#FAF8F5]/60 hover:bg-[#FAF8F5]"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#1A120B]">
                Click to browse or drop event photos here
              </p>
              <p className="text-xs text-[#786E65] mt-1 max-w-sm mx-auto">
                Supports JPG, PNG, WebP up to 50MB per photo. ArcFace facial vectoring begins automatically upon upload.
              </p>
            </div>
          </div>

          {/* Uploaded Photos Gallery & Management */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-bold text-xl text-[#1A120B]">
                  Shoot Gallery
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/70 font-mono">
                  {photos.length} Photos
                </span>
              </div>

              {/* Photo Filter Tabs & Refresh */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-amber-200/80 p-0.5 bg-[#FAF8F5] text-xs">
                  <button
                    onClick={() => setPhotoFilter("all")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      photoFilter === "all"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white font-semibold shadow-2xs"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    All ({photos.length})
                  </button>
                  <button
                    onClick={() => setPhotoFilter("faces")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      photoFilter === "faces"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white font-semibold shadow-2xs"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    Faces Indexed
                  </button>
                  <button
                    onClick={() => setPhotoFilter("pending")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      photoFilter === "pending"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white font-semibold shadow-2xs"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    Pending
                  </button>
                </div>

                <button
                  onClick={loadEventDetails}
                  title="Reload Gallery"
                  className="p-1.5 rounded-xl border border-amber-200/80 text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredPhotos.length === 0 ? (
              <div className="py-16 text-center text-[#8A7E73] text-xs">
                No photos in this filter. Upload photos using the dropzone above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {filteredPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPhoto(p)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-amber-50 border border-amber-200/60 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <img
                      src={p.thumb_url}
                      alt={p.original_filename || "Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                      <span className="text-[10px] text-white font-medium truncate max-w-[80px]">
                        {p.original_filename}
                      </span>
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </div>

                    {/* Face Count Badge */}
                    {p.face_count > 0 && (
                      <span className="absolute top-2 right-2 text-[9px] font-mono font-bold bg-[#1A120B]/85 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 backdrop-blur-xs">
                        {p.face_count} {p.face_count === 1 ? "face" : "faces"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-[#1A120B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-amber-200 shadow-2xl flex flex-col animate-fade-rise">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="overflow-hidden">
                <h3 className="font-heading font-bold text-base text-[#1A120B] truncate">
                  {selectedPhoto.original_filename || "Photo Preview"}
                </h3>
                <p className="text-xs text-[#6B5E52] font-mono">
                  {selectedPhoto.face_count || 0} faces detected • {formatDate(selectedPhoto.uploaded_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Download */}
                <a
                  href={selectedPhoto.web_url || selectedPhoto.thumb_url}
                  download={selectedPhoto.original_filename || "event-photo.jpg"}
                  target="_blank"
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                {/* Delete */}
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  disabled={deletingPhotoId === selectedPhoto.id}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                {/* Close */}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-xl text-[#786E65] hover:text-[#1A120B] hover:bg-amber-50 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Photo Body */}
            <div className="flex-1 bg-black/5 flex items-center justify-center p-4 overflow-auto min-h-[300px]">
              <img
                src={selectedPhoto.web_url || selectedPhoto.thumb_url}
                alt={selectedPhoto.original_filename || "Preview"}
                className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
