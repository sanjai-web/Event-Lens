"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, Sparkles, ArrowRight, User } from "lucide-react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("eventlens_token"));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform duration-200">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight text-ink-900">
              Event<span className="text-brand-500">Lens</span>
            </span>
            <span className="text-[10px] text-ink-500 tracking-wider font-semibold -mt-1 uppercase">
              AI Photo Delivery
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
          <Link href="/#how-it-works" className="hover:text-brand-500 transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="hover:text-brand-500 transition-colors">
            Per-Event Pricing
          </Link>
          <Link href="/#features" className="hover:text-brand-500 transition-colors">
            Features
          </Link>
          <Link href="/privacy" className="hover:text-brand-500 transition-colors">
            DPDP Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-black transition-all shadow-soft"
            >
              <User className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-soft hover:shadow-glow-brand transition-all duration-200"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
