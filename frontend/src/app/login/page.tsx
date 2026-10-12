"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      localStorage.setItem("eventlens_token", res.access_token);
      localStorage.setItem("eventlens_refresh_token", res.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] text-[#1A120B] selection:bg-amber-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Radial Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-400/20 via-rose-300/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between border-b border-amber-100/60 bg-white/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="font-heading font-bold text-3xl tracking-tight text-[#1A120B] group-hover:text-amber-800 transition-colors">
            EventLens<sup className="text-xs font-sans text-amber-600">®</sup>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#786E65] hidden sm:inline">New to EventLens?</span>
          <Link
            href="/signup"
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-medium border border-amber-300/80 bg-white/80 text-amber-900 hover:bg-amber-100 transition-all shadow-sm"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Center Form Container */}
      <main className="relative z-10 max-w-md mx-auto px-6 py-12 flex-1 w-full flex flex-col justify-center animate-fade-rise">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300/70 bg-white/90 backdrop-blur-md text-xs font-medium text-amber-900 shadow-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Photographer Console</span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A120B] tracking-tight">
            Welcome back, <span className="italic bg-gradient-to-r from-amber-700 via-rose-600 to-amber-700 bg-clip-text text-transparent">Creator.</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#786E65]">
            Sign in to manage your wedding shoots, live QR tent cards, and guest deliveries.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-9 border border-amber-200/80 shadow-xl shadow-amber-950/5">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-amber-100 text-center text-xs text-[#786E65]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-amber-800 hover:text-amber-950 transition-colors">
              Sign up free →
            </Link>
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
