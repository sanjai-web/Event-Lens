"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Calendar,
  ChevronRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  HardDrive,
  Users,
  Camera,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

const TIERS = [
  {
    id: "starter_10gb",
    name: "Starter Studio",
    price: "₹799",
    storage: "10 GB",
    photos: "~2,000 photos",
    desc: "Intimate gatherings, haldi, birthdays & ring ceremonies.",
    recommended: false,
    alerts: "Web gallery delivery",
    features: ["10 GB Cloudflare R2 Storage", "Web AI Selfie Search", "Instant Table QR Code Kit", "No monthly contracts"],
  },
  {
    id: "standard_25gb",
    name: "Wedding Pro",
    price: "₹1,499",
    storage: "25 GB",
    photos: "~5,000 photos",
    desc: "Single-day grand weddings & major family celebrations.",
    recommended: true,
    alerts: "300 WhatsApp Alerts included",
    features: ["25 GB High-Speed R2 Storage", "300 Automated WhatsApp Alerts", "Sub-2s Facial Recognition", "Table Tent PDF Generator", "Studio Watermark Protection"],
  },
  {
    id: "grand_60gb",
    name: "Grand Royale",
    price: "₹2,499",
    storage: "60 GB",
    photos: "~12,000 photos",
    desc: "Multi-day luxury destination weddings & royal receptions.",
    recommended: false,
    alerts: "800 WhatsApp Alerts included",
    features: ["60 GB High-Speed R2 Storage", "800 Automated WhatsApp Alerts", "VIP Multi-angle Face Search", "Unlimited Guest Downloads", "60-Day Active Gallery Hosting"],
  },
  {
    id: "enterprise_150gb",
    name: "Agency Elite",
    price: "₹4,999",
    storage: "150 GB",
    photos: "~30,000 photos",
    desc: "Massive celebrity destination weddings & studio fleets.",
    recommended: false,
    alerts: "2,000 WhatsApp Alerts included",
    features: ["150 GB High-Speed R2 Storage", "2,000 Automated WhatsApp Alerts", "Priority GPU Face Vectoring", "Custom Studio Branding", "90-Day Extended Cloud Archival"],
  },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("Wedding & Reception");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [planTier, setPlanTier] = useState("standard_25gb");
  const [faceSearchEnabled, setFaceSearchEnabled] = useState(true);
  const [whatsappDelivery, setWhatsappDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMe().then(setProfile).catch(() => {});
  }, []);

  const selectedTierObj = TIERS.find((t) => t.id === planTier) || TIERS[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for the event.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createEvent({
        name: `${name.trim()}${venue ? ` — ${venue.trim()}` : ""}`,
        event_date: eventDate,
        plan_tier: planTier,
      });

      router.push(`/events/${res.event.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A120B] flex flex-col lg:flex-row antialiased">
      {/* Left Sidebar */}
      <Sidebar profile={profile} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 w-full flex-1">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#786E65] mb-6">
            <Link href="/dashboard" className="hover:text-[#1A120B] transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-[#1A120B]">Create New Shoot</span>
          </div>

          {/* Page Header */}
          <div className="pb-6 mb-8 border-b border-amber-100/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7E73] font-mono block mb-1">
              Event Onboarding
            </span>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
              Create Event &amp; Activate QR Kit
            </h1>
            <p className="text-sm text-[#6B5E52] mt-1.5 max-w-2xl leading-relaxed">
              Configure your couple's celebration details and select a transparent, per-event AI processing package. Zero monthly subscriptions.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Two-Column Setup Grid */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Details & Tiers (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Card 1: Event Details */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-100/90 shadow-xs">
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-amber-100/70">
                  <Camera className="w-5 h-5 text-amber-700" />
                  <h2 className="font-heading font-bold text-lg text-[#1A120B]">
                    1. Celebration Details
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* Event Title */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-2">
                      Event or Couple Title <span className="text-amber-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aditya & Priya Royal Wedding"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200/80 bg-white placeholder:text-[#8A7E73] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-[#1A120B]"
                    />
                  </div>

                  {/* Occasion & Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-2">
                        Occasion Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-[#1A120B]"
                      >
                        <option value="Wedding & Reception">Wedding &amp; Reception</option>
                        <option value="Sangeet & Mehendi">Sangeet &amp; Mehendi</option>
                        <option value="Haldi Ceremony">Haldi Ceremony</option>
                        <option value="Engagement & Ring Ceremony">Engagement &amp; Ring Ceremony</option>
                        <option value="Birthday & Celebration">Birthday &amp; Celebration</option>
                        <option value="Corporate Gala">Corporate Gala</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-2">
                        Shoot Date <span className="text-amber-700">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-[#1A120B]"
                      />
                    </div>
                  </div>

                  {/* Venue & City */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-2">
                      Venue &amp; City (Optional)
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Taj Lake Palace, Udaipur"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200/80 bg-white placeholder:text-[#8A7E73] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-[#1A120B]"
                    />
                  </div>

                  {/* Feature Toggles */}
                  <div className="pt-2 border-t border-amber-100/70 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faceSearchEnabled}
                        onChange={(e) => setFaceSearchEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-amber-300"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[#1A120B] block">
                          Instant Facial Recognition Search
                        </span>
                        <span className="text-[11px] text-[#6B5E52]">
                          Guests scan a selfie and find every photo they appear in.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappDelivery}
                        onChange={(e) => setWhatsappDelivery(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-amber-300"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[#1A120B] block">
                          WhatsApp Automated Photo Delivery
                        </span>
                        <span className="text-[11px] text-[#6B5E52]">
                          Dispatches personalized photo albums to guests over official WhatsApp API.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Plan Selection */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-100/90 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-amber-100/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                    <h2 className="font-heading font-bold text-lg text-[#1A120B]">
                      2. Choose Event Package
                    </h2>
                  </div>
                  <span className="text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 font-mono">
                    Pay-Per-Event • No Monthly Fees
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TIERS.map((tier) => {
                    const isSelected = planTier === tier.id;

                    return (
                      <div
                        key={tier.id}
                        onClick={() => setPlanTier(tier.id)}
                        className={`relative rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-amber-600 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 shadow-md ring-2 ring-amber-600/30"
                            : "border-amber-200/60 bg-white hover:border-amber-300 hover:shadow-xs"
                        }`}
                      >
                        {tier.recommended && (
                          <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                            Most Popular
                          </span>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="font-heading font-bold text-base text-[#1A120B]">
                              {tier.name}
                            </h3>
                            <div className="font-heading font-bold text-xl text-amber-800">
                              {tier.price}
                            </div>
                          </div>

                          <p className="text-xs text-[#6B5E52] mb-3 leading-relaxed">
                            {tier.desc}
                          </p>

                          <div className="space-y-1.5 py-2 border-t border-amber-100/60 text-xs text-[#786E65]">
                            <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                              <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                              <span>{tier.storage} ({tier.photos})</span>
                            </div>
                            <div className="text-[11px] text-[#8A7E73]">
                              {tier.alerts}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-100/60 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-amber-800 font-mono">
                            {isSelected ? "Selected Tier" : "Click to select"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-amber-700 bg-amber-700 text-white"
                                : "border-amber-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Instant Activation (4 cols) */}
            <div className="lg:col-span-4 sticky top-6 space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />

                <h3 className="font-heading font-bold text-lg text-[#1A120B] pb-3 mb-4 border-b border-amber-100/80">
                  Event Activation Summary
                </h3>

                <div className="space-y-3.5 text-xs text-[#6B5E52]">
                  <div className="flex justify-between">
                    <span>Shoot Title:</span>
                    <span className="font-semibold text-[#1A120B] truncate max-w-[160px]">
                      {name || "Untitled Shoot"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-semibold text-[#1A120B]">
                      {eventDate}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Occasion:</span>
                    <span className="font-semibold text-[#1A120B]">
                      {eventType}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Selected Package:</span>
                    <span className="font-semibold text-amber-800">
                      {selectedTierObj.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Cloud Storage Quota:</span>
                    <span className="font-semibold text-[#1A120B]">
                      {selectedTierObj.storage}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-amber-100/80 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#1A120B]">Total Investment:</span>
                    <span className="font-heading font-bold text-2xl text-amber-800">
                      {selectedTierObj.price}
                    </span>
                  </div>
                </div>

                {/* Included Perks Checklist */}
                <div className="mt-5 p-3.5 rounded-xl bg-[#FAF8F5] border border-amber-200/60 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A7E73] font-mono block">
                    Kit Includes:
                  </span>
                  {selectedTierObj.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#6B5E52]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-semibold text-sm shadow-md shadow-amber-800/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating QR Kit...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate &amp; Create QR Kit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#8A7E73] mt-3">
                  Instant activation in test mode • Instant QR generation
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
