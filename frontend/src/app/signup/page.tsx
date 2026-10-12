"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  AlertCircle,
  Sparkles,
  Zap,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.signup({
        name,
        email,
        password,
        business_name: businessName,
        phone,
      });
      localStorage.setItem("eventlens_token", res.access_token);
      localStorage.setItem("eventlens_refresh_token", res.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] text-[#1A120B] selection:bg-amber-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Radial Warmth */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-tr from-amber-400/20 via-rose-300/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[350px] bg-gradient-to-tr from-orange-400/15 via-amber-300/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between border-b border-amber-100/60 bg-white/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="font-heading font-bold text-3xl tracking-tight text-[#1A120B] group-hover:text-amber-800 transition-colors">
            EventLens<sup className="text-xs font-sans text-amber-600">®</sup>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#786E65] hidden sm:inline">Already registered?</span>
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-medium border border-amber-300/80 bg-white/80 text-amber-900 hover:bg-amber-100 transition-all shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content: Dual-Column Showcase & Form */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand Story & Value Proposition */}
        <div className="lg:col-span-6 space-y-8 animate-fade-rise">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/70 bg-white/90 backdrop-blur-md text-xs font-medium text-amber-900 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Built exclusively for Indian Wedding Photographers</span>
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-6xl text-[#1A120B] leading-[1.05] tracking-tight">
            Deliver every cherished frame,{" "}
            <span className="italic bg-gradient-to-r from-amber-700 via-rose-600 to-amber-700 bg-clip-text text-transparent">
              pure magic in seconds.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E52] leading-relaxed max-w-xl font-sans">
            Replace cumbersome Google Drive links with instant AI facial recognition. Guests scan a table QR, take a single selfie, and receive their private album over WhatsApp before the reception ends.
          </p>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-amber-200/80 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1A120B]">512-dim ArcFace AI</h3>
              <p className="text-xs text-[#786E65] mt-1">
                Sub-50ms matching across 10,000+ photos even with turbans and sunglasses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-amber-200/80 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1A120B]">Meta WhatsApp Cloud</h3>
              <p className="text-xs text-[#786E65] mt-1">
                Branded photo alert notifications sent directly to Indian guests.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-amber-200/80 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-3">
                <Camera className="w-4 h-4 text-rose-700" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1A120B]">Zero-Egress R2</h3>
              <p className="text-xs text-[#786E65] mt-1">
                Direct browser-to-Cloudflare uploads. Save ₹10,000+ per month on cloud bills.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-amber-200/80 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1A120B]">DPDP Act 2023</h3>
              <p className="text-xs text-[#786E65] mt-1">
                Fully compliant biometric data lifecycle with automated 30/60-day vector purges.
              </p>
            </div>
          </div>

          {/* Social Proof Pill */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-800 text-white font-heading text-xs flex items-center justify-center border-2 border-white shadow-sm font-semibold">
                V
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-amber-700 text-white font-heading text-xs flex items-center justify-center border-2 border-white shadow-sm font-semibold">
                A
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-800 to-amber-700 text-white font-heading text-xs flex items-center justify-center border-2 border-white shadow-sm font-semibold">
                K
              </div>
            </div>
            <div className="text-xs text-[#6B5E52]">
              <span className="font-semibold text-[#1A120B]">450+ Studios</span> across Jaipur, Mumbai, Udaipur &amp; Bengaluru
            </div>
          </div>
        </div>

        {/* Right Column: The Sign Up Form */}
        <div className="lg:col-span-6 flex justify-center animate-fade-rise-delay">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-amber-200/80 shadow-xl shadow-amber-950/5">
            <div className="mb-8">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 font-semibold">
                Instant 2-Minute Setup
              </span>
              <h2 className="mt-3 font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
                Create Photographer Studio
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#786E65]">
                No credit card required. Free tier access included automatically.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Rathore"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                  Photography Studio / Business Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Royal Heritage Candid Studios"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                    WhatsApp Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arjun@studios.in"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:shadow-xl hover:shadow-amber-600/30 disabled:opacity-60 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/15"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Begin Photographer Journey</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-amber-100 flex items-center justify-between text-xs text-[#786E65]">
              <span>Already have an account?</span>
              <Link href="/login" className="font-semibold text-amber-800 hover:text-amber-950 transition-colors">
                Sign in to Console →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs text-[#8A7E73] border-t border-amber-100/60 bg-white/40">
        © {new Date().getFullYear()} EventLens Technologies Pvt. Ltd. · DPDP Act 2023 Biometric Compliant
      </footer>
    </div>
  );
}
