"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare, ArrowLeft, CheckCircle2, AlertCircle, Phone, ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export default function WhatsAppOptInPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.registerGuest(slug, {
        phone_number: phone.startsWith("+") ? phone : `+91${phone.replace(/^0+/, "")}`,
        whatsapp_opt_in: true,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to register for WhatsApp alerts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] text-[#1A120B] py-12 px-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-emerald-400/15 via-amber-300/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-rise">
        <Link
          href={`/e/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-800 hover:text-amber-950 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/60 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Gallery</span>
        </Link>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-9 border border-amber-200/80 shadow-xl shadow-amber-950/5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200/60 shadow-sm">
            <MessageSquare className="w-7 h-7" />
          </div>

          <h1 className="font-heading font-bold text-3xl text-[#1A120B] tracking-tight">
            Get Photos on WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-[#786E65] mt-2 mb-6 leading-relaxed">
            Enter your mobile number. We will message you instantly whenever the photographer captures new photos matching your face.
          </p>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-heading font-bold text-xl text-emerald-950">You&apos;re All Set!</h3>
              <p className="text-xs text-emerald-800 mt-1 mb-5">
                We sent a welcome message to your WhatsApp. You will receive private links as new ceremony photos are uploaded.
              </p>
              <Link
                href={`/e/${slug}`}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <span>Return to Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1A120B] uppercase tracking-wider mb-1.5">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-amber-200/80 text-sm text-[#1A120B] placeholder:text-[#A89F95] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                  />
                </div>
                <span className="text-[11px] text-[#8A7E73] mt-1 block">
                  Indian numbers will automatically prepend +91
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-4 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enable WhatsApp Delivery</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
