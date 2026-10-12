"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  QrCode,
  Users,
  Image as ImageIcon,
  HardDrive,
  ExternalLink,
  Calendar,
  AlertCircle,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Copy,
  Check,
  Share2,
  Download,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMb, formatDate, getStatusBadge } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "photos" | "guests">("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQrEvent, setSelectedQrEvent] = useState<any | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [userProfile, eventList] = await Promise.all([
        api.getMe(),
        api.listEvents(),
      ]);
      setProfile(userProfile);
      setEvents(eventList);
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem("eventlens_token");
        router.push("/login");
      } else {
        setError(err.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsAppShare = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/e/${event.slug}`;
    const message = `Namaste! Here is the live AI Photo Gallery for *${event.name}*:\n🔗 ${url}\n\nGuests can scan the QR code or take a selfie to find all photos they appear in!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const totalStorageUsed = events.reduce((acc, ev) => acc + (ev.storage_used_mb || 0), 0);
  const totalStorageLimit = events.reduce((acc, ev) => acc + (ev.storage_limit_mb || 0), 0);
  const totalPhotos = events.reduce((acc, ev) => acc + (ev.photo_count || 0), 0);
  const totalGuests = events.reduce((acc, ev) => acc + (ev.guest_count || 0), 0);

  const filteredAndSortedEvents = useMemo(() => {
    let result = events.filter((ev) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ev.name.toLowerCase().includes(query) ||
        ev.slug.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "live") return ev.status === "live";
      if (statusFilter === "created") return ev.status === "created";
      if (statusFilter === "completed") return ev.status === "completed" || ev.status === "archived";
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || b.event_date).getTime() - new Date(a.created_at || a.event_date).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || a.event_date).getTime() - new Date(b.created_at || b.event_date).getTime();
      }
      if (sortBy === "photos") {
        return (b.photo_count || 0) - (a.photo_count || 0);
      }
      if (sortBy === "guests") {
        return (b.guest_count || 0) - (a.guest_count || 0);
      }
      return 0;
    });

    return result;
  }, [events, searchQuery, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A120B] flex flex-col lg:flex-row antialiased">
      {/* Left Sidebar */}
      <Sidebar
        profile={profile}
        storageUsedMb={totalStorageUsed}
        storageLimitMb={totalStorageLimit || 25000}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 w-full flex-1">
          {/* Top Luxury Studio Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-8 mb-8 border-b border-amber-100/80">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7E73] font-mono">
                  Photographer Studio Console
                </span>
                <span className="text-xs text-amber-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  R2 Cloud Live Sync
                </span>
              </div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                Welcome, {profile?.business_name || profile?.name || "Studio Master"}
              </h1>
              <p className="text-sm text-[#6B5E52] mt-1.5 max-w-2xl leading-relaxed">
                Seamless real-time facial recognition telemetry, guest delivery portals, and high-speed Cloudflare R2 photo storage.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-medium text-sm shadow-md shadow-amber-800/20 hover:shadow-lg hover:shadow-amber-800/30 hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </Link>
            </div>
          </div>

          {/* 4 Luxury KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {/* Total Events */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-100/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#8A7E73] uppercase tracking-wider font-mono">
                  Total Events
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                {events.length}
              </div>
              <p className="text-xs text-[#6B5E52] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Active wedding portfolios</span>
              </p>
            </div>

            {/* Photos Uploaded */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-100/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#8A7E73] uppercase tracking-wider font-mono">
                  Photos Indexed
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                {totalPhotos.toLocaleString()}
              </div>
              <p className="text-xs text-[#6B5E52] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>512-dim ArcFace biometric vectors</span>
              </p>
            </div>

            {/* Guest Matches */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-100/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#8A7E73] uppercase tracking-wider font-mono">
                  Guests Matched
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
                  <Users className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                {totalGuests.toLocaleString()}
              </div>
              <p className="text-xs text-[#6B5E52] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Instant WhatsApp &amp; Web deliveries</span>
              </p>
            </div>

            {/* Cloud Storage */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-100/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#8A7E73] uppercase tracking-wider font-mono">
                  Cloudflare R2 Storage
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                {formatMb(totalStorageUsed)}
              </div>
              <div className="w-full bg-amber-100/70 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(4, (totalStorageUsed / Math.max(1, totalStorageLimit)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Events Management Directory Section */}
          <div className="bg-white rounded-2xl border border-amber-100/90 shadow-sm overflow-hidden mb-10">
            {/* Directory Controls Header */}
            <div className="p-5 sm:p-6 border-b border-amber-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#FAF8F5]/80 via-white to-[#FAF8F5]/60">
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-bold text-xl text-[#1A120B]">
                  Events Directory
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/60 font-mono">
                  {events.length} Shoots
                </span>
              </div>

              {/* Real-time Search, Filter, and Sort Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  <Search className="w-4 h-4 text-amber-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by couple, venue, slug..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200/80 bg-white placeholder:text-[#8A7E73] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-[#1A120B]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A7E73] hover:text-[#1A120B]"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center rounded-xl border border-amber-200/80 p-0.5 bg-amber-50/40 text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === "all"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-xs font-semibold"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("live")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === "live"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-xs font-semibold"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    Live
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === "completed"
                        ? "bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-xs font-semibold"
                        : "text-[#6B5E52] hover:text-[#1A120B]"
                    }`}
                  >
                    Completed
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 text-xs text-[#6B5E52] bg-white border border-amber-200/80 rounded-xl px-2.5 py-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs text-[#1A120B] focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="photos">Most Photos</option>
                    <option value="guests">Most Guests</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Events Feed Content */}
            <div className="p-5 sm:p-6">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-9 h-9 border-3 border-amber-200 border-t-amber-700 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#6B5E52] font-medium">Loading luxury event directory...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              ) : filteredAndSortedEvents.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200/70">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-semibold text-base text-[#1A120B]">
                    {searchQuery ? "No matching events found" : "No events created yet"}
                  </h3>
                  <p className="text-xs text-[#6B5E52] mt-1 mb-5 leading-relaxed">
                    {searchQuery
                      ? "Try searching with a different keyword or reset the filter."
                      : "Create your first event shoot to generate printable table QR kits and enable guest face delivery."}
                  </p>
                  <Link
                    href="/events/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-medium text-xs shadow-md shadow-amber-800/20 hover:scale-105 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Event</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredAndSortedEvents.map((event) => {
                    const badge = getStatusBadge(event.status);
                    const percentUsed = Math.min(
                      100,
                      Math.round(((event.storage_used_mb || 0) / Math.max(1, event.storage_limit_mb)) * 100)
                    );
                    const isCopied = copiedId === event.id;

                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-100/90 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/5 transition-all duration-200 flex flex-col justify-between group relative"
                      >
                        <div>
                          {/* Top Status & Date Pill */}
                          <div className="flex items-center justify-between gap-2 mb-3">
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

                          {/* Event Title */}
                          <h3 className="font-heading font-bold text-xl text-[#1A120B] group-hover:text-amber-800 transition-colors leading-snug line-clamp-1">
                            {event.name}
                          </h3>

                          {/* Quick Slug Link */}
                          <p className="text-[11px] font-mono text-[#8A7E73] truncate mt-1">
                            /e/{event.slug}
                          </p>

                          {/* Metrics Pill Row */}
                          <div className="flex items-center gap-4 mt-3.5 text-xs text-[#6B5E52] bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/70">
                            <div className="flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                              <span><strong>{event.photo_count || 0}</strong> photos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-amber-700" />
                              <span><strong>{event.guest_count || 0}</strong> guests</span>
                            </div>
                          </div>

                          {/* Storage Bar */}
                          <div className="mt-4 pt-3.5 border-t border-amber-100/60">
                            <div className="flex justify-between text-[11px] text-[#786E65] mb-1.5 font-medium">
                              <span>Storage Used ({percentUsed}%)</span>
                              <span className="font-mono text-[#1A120B]">
                                {formatMb(event.storage_used_mb || 0)} / {formatMb(event.storage_limit_mb)}
                              </span>
                            </div>
                            <div className="w-full bg-amber-100/70 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  percentUsed > 85
                                    ? "bg-rose-500"
                                    : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700"
                                }`}
                                style={{ width: `${Math.max(4, percentUsed)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Proper Functionalities: Interactive Action Row */}
                        <div className="mt-5 pt-4 border-t border-amber-100/70 flex items-center justify-between gap-2">
                          <Link
                            href={`/events/${event.id}`}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <span>Manage Shoot</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Icon Actions */}
                          <div className="flex items-center gap-1">
                            {/* Copy Public Link Button with Tooltip */}
                            <button
                              onClick={(e) => handleCopyLink(event, e)}
                              title="Copy Guest Link"
                              className={`p-2 rounded-xl transition-all border ${
                                isCopied
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50 border-amber-200/50"
                              }`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {/* Share on WhatsApp Button */}
                            <button
                              onClick={(e) => handleWhatsAppShare(event, e)}
                              title="Share on WhatsApp"
                              className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* View Guest Gallery */}
                            <Link
                              href={`/e/${event.slug}`}
                              target="_blank"
                              title="Open Guest Gallery"
                              className="p-2 rounded-xl text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50 border border-amber-200/50 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* View/Download QR */}
                            {event.qr_code_url && (
                              <button
                                onClick={() => setSelectedQrEvent(event)}
                                title="View & Download Table QR Kit"
                                className="p-2 rounded-xl text-amber-800 hover:bg-amber-100/60 border border-amber-200/70 transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Luxury QR Code Preview Modal */}
      {selectedQrEvent && (
        <div className="fixed inset-0 z-50 bg-[#1A120B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-amber-200 shadow-2xl relative animate-fade-rise">
            <button
              onClick={() => setSelectedQrEvent(null)}
              className="absolute top-5 right-5 text-[#8A7E73] hover:text-[#1A120B] text-xl font-bold p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                Printable Table QR Kit
              </span>
              <h3 className="font-heading font-bold text-2xl text-[#1A120B] mt-3">
                {selectedQrEvent.name}
              </h3>
              <p className="text-xs text-[#6B5E52] mt-1 max-w-xs mx-auto">
                Place this QR code on dining tables, welcome banners, or photo stands for instant guest selfie access.
              </p>

              {/* QR Image */}
              <div className="mt-6 p-4 rounded-2xl bg-[#FAF8F5] border border-amber-200/80 inline-block shadow-inner">
                {selectedQrEvent.qr_code_url ? (
                  <img
                    src={selectedQrEvent.qr_code_url}
                    alt="Event QR Code"
                    className="w-56 h-56 mx-auto rounded-xl object-contain bg-white p-2"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-[#8A7E73]">
                    No QR code available
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {selectedQrEvent.qr_code_url && (
                  <a
                    href={selectedQrEvent.qr_code_url}
                    download={`${selectedQrEvent.slug}-table-qr.png`}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-800/20 hover:scale-[1.02] transition-transform"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download High-Res PNG</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/e/${selectedQrEvent.slug}`;
                    navigator.clipboard.writeText(url);
                    alert("Guest link copied to clipboard!");
                  }}
                  className="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Gallery Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
