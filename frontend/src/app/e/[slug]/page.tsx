"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Camera,
  Sparkles,
  MessageSquare,
  X,
  Download,
  Share2,
  Calendar,
  AlertCircle,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function GuestGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [eventInfo, setEventInfo] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGallery();
  }, [slug]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const [info, gallery] = await Promise.all([
        api.getPublicEventInfo(slug),
        api.getPublicGallery(slug),
      ]);
      setEventInfo(info);
      setPhotos(gallery.photos);
    } catch (err: any) {
      setError(err.message || "Failed to load event gallery.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#786E65] font-medium">Loading event photos...</p>
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center border border-amber-200/80 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-[#1A120B]">Event Not Available</h2>
          <p className="text-sm text-[#786E65] mt-2">
            This event gallery might be expired or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A120B] pb-28">
      {/* Event Top Banner */}
      <header className="bg-white/90 backdrop-blur-md border-b border-amber-100/80 py-5 px-6 sm:px-8 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-widest">
                EventLens Live Gallery
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A120B] tracking-tight">
              {eventInfo.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#786E65] mt-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{formatDate(eventInfo.event_date)}</span>
              <span>•</span>
              <span>{photos.length} photos</span>
            </div>
          </div>

          <Link
            href={`/e/${slug}/optin`}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Alerts</span>
          </Link>
        </div>
      </header>

      {/* Photo Masonry Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 animate-fade-rise">
        {photos.length === 0 ? (
          <div className="py-24 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-2xl text-[#1A120B]">Capturing Memories</h3>
            <p className="text-sm text-[#786E65] mt-2 leading-relaxed">
              The photographer is currently capturing moments! New photos will appear here as soon as they are uploaded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-amber-50/40 cursor-pointer border border-amber-200/60 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                <img
                  src={photo.thumb_url}
                  alt="Event moment"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="p-2.5 rounded-full bg-white/95 text-[#1A120B] shadow-md">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Sticky Bottom Bar for Mobile Guest Action */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl border border-amber-200/80 p-2 rounded-full shadow-xl shadow-amber-950/15 flex items-center justify-between gap-2 pointer-events-auto">
          <Link
            href={`/e/${slug}/selfie`}
            className="flex-1 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-medium text-sm shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Find My Photos</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </Link>

          <Link
            href={`/e/${slug}/optin`}
            className="p-3.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200 shrink-0"
            title="WhatsApp Alerts"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] relative flex flex-col items-center">
            <img
              src={selectedPhoto.web_url || selectedPhoto.thumb_url}
              alt="Full-size event photo"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />

            <div className="mt-4 flex items-center gap-3">
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
