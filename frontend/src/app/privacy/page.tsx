"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Clock, Trash2, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A120B] flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-amber-100/60 bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="font-heading font-bold text-3xl tracking-tight text-[#1A120B] group-hover:text-amber-800 transition-colors">
            EventLens<sup className="text-xs font-sans text-amber-600">®</sup>
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full px-5 py-2 text-xs sm:text-sm font-medium border border-amber-300/80 bg-white/80 text-amber-900 hover:bg-amber-100 transition-all shadow-sm"
        >
          Return to Home
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-12 flex-1 w-full animate-fade-rise">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-800 hover:text-amber-950 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-amber-200/80 shadow-xl shadow-amber-950/5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-6 border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliant</span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-5xl text-[#1A120B] tracking-tight mb-3">
            Biometric Data Governance &amp; Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#8A7E73] mb-8">
            Jurisdiction: Republic of India · Applicable to all EventLens Weddings &amp; Events
          </p>

          <div className="text-sm text-[#5A4F44] space-y-8 leading-relaxed font-sans">
            <section>
              <h2 className="font-heading font-bold text-2xl text-[#1A120B] mb-2.5">1. Scope and Purpose</h2>
              <p>
                EventLens is built specifically for wedding cinematographers and event photographers in India to deliver photos to attendees and guests at weddings, corporate galas, and family celebrations. We treat guest biometric data with the utmost discretion and strict compliance with the provisions of India&apos;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-2xl text-[#1A120B] mb-2.5">2. How Biometric Face Matching Works</h2>
              <p>
                When a guest captures or uploads a selfie to discover photos from the ceremony:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 mt-3 text-[#4A4036]">
                <li>
                  Our ArcFace engine maps facial landmarks and translates them into a <strong>512-dimensional numerical vector (embedding)</strong>.
                </li>
                <li>
                  This embedding is an irreversible mathematical array. A human face cannot be visually reconstructed from this vector hash.
                </li>
                <li>
                  The vector is matched exclusively against photos uploaded for that specific event using cosine distance. It is <strong>never cross-matched across different photographers, events, or third-party datasets</strong>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-2xl text-[#1A120B] mb-2.5">3. Auto-Expiring Data Lifecycle</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-900 font-bold mb-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span className="font-heading font-bold text-lg">30-Day Photo Archival</span>
                  </div>
                  <p className="text-xs text-[#786E65] leading-relaxed">
                    Original RAW/JPEG event photos are automatically purged from Cloudflare R2 storage 30 days after the celebration concludes.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-900 font-bold mb-1.5">
                    <Trash2 className="w-4 h-4 text-rose-700" />
                    <span className="font-heading font-bold text-lg">60-Day Vector Destruction</span>
                  </div>
                  <p className="text-xs text-[#786E65] leading-relaxed">
                    All biometric vector embeddings, guest selfie records, and cached thumbnails are permanently wiped from the database.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading font-bold text-2xl text-[#1A120B] mb-2.5">4. Right to Erasure (&quot;Forget My Face&quot;)</h2>
              <p>
                Under Section 12 of the DPDP Act 2023, every guest maintains the unconditional right to withdraw consent and request instantaneous vector deletion. Guests may trigger this by emailing <code>privacy@eventlens.in</code> or by clicking the &quot;Erase My Biometrics&quot; button inside their private web gallery.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-2xl text-[#1A120B] mb-2.5">5. Zero Third-Party Selling or Model Training</h2>
              <p>
                EventLens will <strong>never</strong> sell, monetize, rent, or license guest facial data, phone numbers, or uploaded media to advertisers, brokers, or external AI model trainers. Your wedding moments belong exclusively to you, your family, and your photographer.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-[#8A7E73] border-t border-amber-100/60 bg-white/60">
        © {new Date().getFullYear()} EventLens Technologies Pvt. Ltd. · DPDP Act 2023 Biometric Compliant
      </footer>
    </div>
  );
}
