"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Smartphone,
  Zap,
  ShieldCheck,
  HardDrive,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Camera,
  Search,
  ExternalLink,
  Star,
  Download,
  Share2,
  Heart,
  Check,
} from "lucide-react";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeCeremony, setActiveCeremony] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Custom Fade-in / Fade-out loop logic using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Critical for browser autoplay policies (Chrome, Edge, Safari, Firefox)
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");

    // Set initial visible opacity
    video.style.opacity = "1";

    let animFrameId: number;

    const monitorLoop = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const { currentTime, duration } = video;
        const fadeDuration = 0.5; // 0.5s fade window

        let targetOpacity = 1;

        // Fade in over 0.5s at the start (opacity 0 to 1)
        if (currentTime < fadeDuration) {
          targetOpacity = Math.max(0, Math.min(1, currentTime / fadeDuration));
        }
        // Fade out over 0.5s before the end (opacity 1 to 0)
        else if (currentTime > duration - fadeDuration) {
          targetOpacity = Math.max(0, Math.min(1, (duration - currentTime) / fadeDuration));
        } else {
          targetOpacity = 1;
        }

        // Apply directly to DOM style to avoid 60fps React re-renders
        video.style.opacity = String(targetOpacity);
      }

      animFrameId = requestAnimationFrame(monitorLoop);
    };

    const handleEnded = () => {
      // On ended event: set opacity to 0, wait 100ms, reset currentTime = 0, then play() again
      video.style.opacity = "0";
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      }, 100);
    };

    video.addEventListener("ended", handleEnded);
    animFrameId = requestAnimationFrame(monitorLoop);

    // Initial play attempt with user interaction fallback
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const triggerPlay = () => {
          if (video) video.play().catch(() => {});
          window.removeEventListener("click", triggerPlay);
          window.removeEventListener("scroll", triggerPlay);
          window.removeEventListener("touchstart", triggerPlay);
        };
        window.addEventListener("click", triggerPlay, { once: true });
        window.addEventListener("scroll", triggerPlay, { once: true });
        window.addEventListener("touchstart", triggerPlay, { once: true });
      });
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Demo gallery items
  const galleryPhotos = [
    {
      id: 1,
      category: "haldi",
      title: "Haldi Radiance",
      tag: "Haldi Ceremony",
      match: "99.2%",
      color: "from-amber-400 via-yellow-500 to-orange-500",
      accent: "#F59E0B",
      desc: "Marigold petal shower & golden joy",
    },
    {
      id: 2,
      category: "sangeet",
      title: "Sangeet Beats",
      tag: "Sangeet Night",
      match: "98.7%",
      color: "from-indigo-950 via-purple-900 to-amber-500/70",
      accent: "#8B5CF6",
      desc: "Stage spotlights & swirling lehenga",
    },
    {
      id: 3,
      category: "varmala",
      title: "Varmala Royale",
      tag: "Varmala Stage",
      match: "98.4%",
      color: "from-rose-700 via-pink-700 to-amber-400/60",
      accent: "#E11D48",
      desc: "Rose garland exchange at sunset",
    },
    {
      id: 4,
      category: "pheras",
      title: "Sacred Pheras",
      tag: "Mandap Pheras",
      match: "97.9%",
      color: "from-orange-600 via-amber-600 to-red-800",
      accent: "#EA580C",
      desc: "Agni kund glow & holy vows",
    },
    {
      id: 5,
      category: "portraits",
      title: "Royal Portrait",
      tag: "Sunset Portraits",
      match: "99.5%",
      color: "from-amber-600 via-rose-500 to-purple-950",
      accent: "#D97706",
      desc: "Palace courtyard golden hour",
    },
    {
      id: 6,
      category: "reception",
      title: "Grand Reception",
      tag: "Banquet Finale",
      match: "98.1%",
      color: "from-stone-900 via-amber-950 to-amber-500/40",
      accent: "#F59E0B",
      desc: "Fairy light canopy & champagne toast",
    },
  ];

  const filteredPhotos =
    activeCeremony === "all"
      ? galleryPhotos
      : galleryPhotos.filter((p) => p.category === activeCeremony);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#FFFFFF] text-[#000000] selection:bg-amber-500 selection:text-white">
      {/* Navigation Bar (z-50) - Stays static/sticky at top while scrolling */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? "border-b border-amber-200/60 bg-white/95 backdrop-blur-md shadow-sm py-4"
            : "border-b border-amber-100/40 bg-white/80 backdrop-blur-md py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="font-heading font-bold text-3xl tracking-tight text-[#1A120B] group-hover:text-amber-700 transition-colors">
              EventLens<sup className="text-xs font-sans tracking-normal ml-0.5 font-normal text-amber-600">®</sup>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="text-[#1A120B] font-medium transition-colors">
              Home
            </Link>
            <Link href="#how-it-works" className="text-[#6F6F6F] hover:text-amber-800 transition-colors">
              How It Works
            </Link>
            <Link href="#showcase" className="text-[#6F6F6F] hover:text-amber-800 transition-colors">
              Live Showcase
            </Link>
            <Link href="#the-craft" className="text-[#6F6F6F] hover:text-amber-800 transition-colors">
              The AI Engine
            </Link>
            <Link href="#pricing" className="text-[#6F6F6F] hover:text-amber-800 transition-colors">
              Per-Event Pricing
            </Link>
            <Link href="/privacy" className="text-[#6F6F6F] hover:text-amber-800 transition-colors">
              DPDP Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#6F6F6F] hover:text-[#1A120B] transition-colors hidden sm:inline-block font-medium"
            >
              Photographer Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-6 py-2.5 text-sm bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-[#FFFFFF] hover:shadow-lg hover:shadow-amber-600/30 hover:scale-[1.03] transition-all duration-200 font-medium"
            >
              Begin Journey
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Container (Relative with Video Background Layer) */}
      <section
        className="relative min-h-[850px] flex flex-col items-center justify-center text-center px-6 pb-36 overflow-hidden"
        style={{ paddingTop: "calc(8rem - 75px)" }}
      >
        {/* Subtle Ambient Golden Radial Glow behind Hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-400/15 via-rose-400/10 to-transparent blur-3xl pointer-events-none z-0" />

        {/* Background Video Layer (z-0) - anchored inside the hero section */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden z-0"
          style={{ top: "220px" }}
        >
          <video
            ref={videoRef}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ opacity: 1 }}
          />
          {/* Warm Champagne Gradient overlays: blend seamlessly with the warm celebratory palette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-transparent to-[#FDFBF7] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent pointer-events-none opacity-80" />
        </div>

        {/* Hero Section Content (z-10) */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-7xl">
          {/* Warm Champagne Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-white/90 backdrop-blur-md text-xs font-medium text-amber-900 mb-8 shadow-sm animate-fade-rise">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="tracking-wide">AI-Powered Event Photo Delivery for Indian Photographers</span>
            <span className="text-amber-500">✨</span>
          </div>

          {/* Headline matching exact font, sizing, line-height, letter-spacing, and warm emphasis */}
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl max-w-6xl font-extrabold leading-[1.12] sm:leading-[1.08] tracking-tight text-[#1A120B] animate-fade-rise">
            Beyond <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-rose-700 bg-clip-text text-transparent">waiting,</span> we deliver{" "}
            <span className="bg-gradient-to-r from-rose-700 via-amber-600 to-amber-700 bg-clip-text text-transparent">the eternal.</span>
          </h1>

          {/* Description matching exact colors, max-width and animation delay */}
          <p className="text-base sm:text-lg max-w-2xl mt-8 leading-relaxed text-[#5A524C] animate-fade-rise-delay font-sans">
            Building platforms for brilliant photographers, joyous families, and cherished memories. Guests scan a
            table QR, take a selfie, and instantly receive every frame they appear in — delivered pure over web and WhatsApp.
          </p>

          {/* Hero CTA Button matching exact styling, sizing and animation with warm ambient glow */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
            <Link
              href="/signup"
              className="rounded-full px-12 py-4 sm:px-14 sm:py-5 text-base font-medium bg-[#14100C] text-[#FFFFFF] hover:bg-gradient-to-r hover:from-amber-600 hover:to-amber-800 hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-amber-950/15"
            >
              Begin Journey
            </Link>
            <Link
              href="#showcase"
              className="rounded-full px-8 py-4 sm:py-5 text-base font-medium text-[#1A120B] hover:text-amber-700 transition-colors flex items-center gap-2 group"
            >
              <span>Explore The Craft</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Performance & Philosophy Pillars */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full border-t border-amber-200/50 pt-10 text-center animate-fade-rise-delay-2 bg-white/40 backdrop-blur-sm rounded-2xl p-6">
            <div>
              <p className="font-heading text-4xl sm:text-5xl bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent tracking-tight font-bold">
                &lt; 50ms
              </p>
              <p className="text-xs text-[#786E65] mt-1.5 uppercase tracking-wider font-sans font-medium">
                ArcFace Vector Match
              </p>
            </div>
            <div>
              <p className="font-heading text-4xl sm:text-5xl bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent tracking-tight font-bold">
                ₹799
              </p>
              <p className="text-xs text-[#786E65] mt-1.5 uppercase tracking-wider font-sans font-medium">
                Starts Per Event
              </p>
            </div>
            <div>
              <p className="font-heading text-4xl sm:text-5xl bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent tracking-tight font-bold">
                100%
              </p>
              <p className="text-xs text-[#786E65] mt-1.5 uppercase tracking-wider font-sans font-medium">
                WhatsApp Automated
              </p>
            </div>
            <div>
              <p className="font-heading text-4xl sm:text-5xl bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent tracking-tight font-bold">
                DPDP
              </p>
              <p className="text-xs text-[#786E65] mt-1.5 uppercase tracking-wider font-sans font-medium">
                Biometric Privacy Compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Three-Step Guest Experience (Warm Celebratory Palette) */}
      <section
        id="how-it-works"
        className="relative z-10 py-32 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE6] border-t border-amber-100"
      >
        {/* Warm Ambient Orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-800 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              The Guest Experience
            </span>
            <h2 className="font-heading font-bold text-4xl sm:text-6xl text-[#1A120B] mt-4 tracking-tight">
              Zero apps to download.{" "}
              <span className="italic bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 bg-clip-text text-transparent">
                Pure magic in seconds.
              </span>
            </h2>
            <p className="text-[#6B5E52] text-base sm:text-lg mt-4 leading-relaxed font-sans">
              Traditional Google Drive links and USB drives are obsolete. EventLens gives every guest their own curated, private gallery before dessert is served.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Golden Amber Theme */}
            <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/80 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-400 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center mb-6 font-mono text-base font-bold shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                  01
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-mono uppercase tracking-wider mb-2 border border-amber-200">
                  Instant Access
                </div>
                <h3 className="font-heading font-bold text-2xl text-[#1A120B]">Scan Table QR</h3>
                <p className="text-[#6B5E52] text-sm mt-3 leading-relaxed">
                  Place custom-designed QR tent cards on reception tables. Guests scan with their standard phone camera — instantly opening the event gallery without app installs.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-100 flex items-center gap-2 text-xs font-medium text-amber-900">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Instant WebRTC camera launch</span>
              </div>
            </div>

            {/* Step 2: Sunset Rose Theme */}
            <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-rose-200/80 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-400 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white flex items-center justify-center mb-6 font-mono text-base font-bold shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform">
                  02
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-mono uppercase tracking-wider mb-2 border border-rose-200">
                  ArcFace AI
                </div>
                <h3 className="font-heading font-bold text-2xl text-[#1A120B]">Take a Selfie</h3>
                <p className="text-[#6B5E52] text-sm mt-3 leading-relaxed">
                  The guest takes a single selfie. Our ArcFace 512-dimensional vector engine indexes and matches their face against 10,000+ event photos in under 50 milliseconds.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-rose-100 flex items-center gap-2 text-xs font-medium text-rose-900">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>512-dim ArcFace cosine distance</span>
              </div>
            </div>

            {/* Step 3: WhatsApp Emerald & Royal Teal Theme */}
            <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200/80 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center mb-6 font-mono text-base font-bold shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  03
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono uppercase tracking-wider mb-2 border border-emerald-200">
                  Instant Delivery
                </div>
                <h3 className="font-heading font-bold text-2xl text-[#1A120B]">WhatsApp & Web Delivery</h3>
                <p className="text-[#6B5E52] text-sm mt-3 leading-relaxed">
                  Guests immediately browse every photo they appear in, download full-resolution originals, and opt in to receive real-time WhatsApp alerts as new photos are uploaded.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-100 flex items-center gap-2 text-xs font-medium text-emerald-900">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Meta WhatsApp Cloud API integration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Visual Showcase (Warm Wedding Colors) */}
      <section id="showcase" className="relative z-10 py-32 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="rounded-3xl border border-amber-200/70 p-8 sm:p-12 lg:p-16 bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#FFFFFF] shadow-soft-lg relative overflow-hidden">
            {/* Ambient Background Blur */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-200">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  Live Indian Wedding Demonstration
                </span>

                <h3 className="font-heading font-bold text-4xl sm:text-5xl text-[#1A120B] leading-tight">
                  Instant recognition, <br />
                  <span className="italic bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 bg-clip-text text-transparent">
                    flawless accuracy.
                  </span>
                </h3>

                <p className="text-[#6B5E52] text-base leading-relaxed">
                  Indian weddings are grand, colorful, and packed with hundreds of guests. EventLens handles group shots, varied lighting, sunglasses, and headwear with state-of-the-art SCRFD face detection.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-[#1A120B]">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span>Multi-face detection in high-energy dance floors & group portraits</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#1A120B]">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span>Direct-to-R2 zero-egress uploading with client-side presigned URLs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#1A120B]">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span>DPDP Act 2023 compliance with automated 30/60 day lifecycle</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white text-sm font-medium hover:shadow-lg hover:shadow-amber-600/30 hover:scale-[1.03] transition-all duration-200"
                  >
                    <span>Try EventLens Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-[#8A7E73]">No credit card required</span>
                </div>
              </div>

              {/* Visual Simulated Gallery Display with Indian Wedding Colors */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-7 shadow-xl shadow-amber-900/5">
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-amber-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-[#1A120B]">Kavita &amp; Rohan · Royal Udaipur Wedding</span>
                  </div>
                  <span className="font-mono text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                    Live Gallery · 4,280 Photos
                  </span>
                </div>

                {/* Simulated Selfie Match Bar with WhatsApp Integration */}
                <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-rose-50/40 to-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-600 text-white flex items-center justify-center font-heading text-xl font-bold shadow-md shadow-amber-500/20">
                        S
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
                        ✓
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A120B]">
                        Selfie Matched: <span className="text-amber-900">Sneha Kapoor</span>
                      </p>
                      <p className="text-xs text-[#786E65]">Found 48 photos in 38ms (Cosine Match: 0.96)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      98.4% Match
                    </span>
                    <button
                      type="button"
                      className="text-[11px] px-3 py-1 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp Link Sent</span>
                    </button>
                  </div>
                </div>

                {/* Ceremony Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 text-xs font-medium no-scrollbar">
                  {[
                    { id: "all", label: "All Photos (48)" },
                    { id: "haldi", label: "Haldi (12)" },
                    { id: "sangeet", label: "Sangeet (18)" },
                    { id: "varmala", label: "Varmala (10)" },
                    { id: "pheras", label: "Pheras (8)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCeremony(tab.id)}
                      className={`px-3 py-1.5 rounded-full transition-all shrink-0 font-sans ${
                        activeCeremony === tab.id
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-amber-50/60 text-[#6B5E52] hover:bg-amber-100 hover:text-[#1A120B]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Photo Grid with Rich Indian Wedding Palettes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg cursor-pointer"
                    >
                      {/* Gradient Backdrop representing festive ceremony lighting */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-tr ${photo.color} opacity-90 group-hover:opacity-100 transition-opacity`}
                      />

                      {/* Bokeh / Particle Overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/40 pointer-events-none" />

                      {/* Photo Badge & Match Percentage */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-sans font-medium bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                          {photo.tag}
                        </span>
                        <span className="text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                          {photo.match}
                        </span>
                      </div>

                      {/* Bottom Caption & Download Action */}
                      <div className="absolute bottom-2 inset-x-2.5 flex items-end justify-between text-white">
                        <div>
                          <p className="font-heading font-semibold text-sm leading-tight text-white drop-shadow-sm">{photo.title}</p>
                          <p className="text-[10px] text-white/80 line-clamp-1">{photo.desc}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Delivery Notification Preview */}
                <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp preview: &quot;Sneha, 48 photos of you were just captured! Click to view.&quot;</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold shrink-0">Instant Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The Technological Pillars - The Craft (Cinematic Midnight Obsidian & Gold) */}
      <section
        id="the-craft"
        className="relative z-10 py-32 bg-[#0C0A09] text-white border-t border-stone-800 overflow-hidden"
      >
        {/* Warm Golden Embers / Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/15 via-rose-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Engineered For Scale
            </span>
            <h2 className="font-heading font-bold text-4xl sm:text-6xl text-white mt-4 tracking-tight">
              The Architecture of{" "}
              <span className="italic bg-gradient-to-r from-amber-300 via-amber-400 to-orange-300 bg-clip-text text-transparent">
                Pure Flow.
              </span>
            </h2>
            <p className="text-stone-400 text-base sm:text-lg mt-4 leading-relaxed font-sans">
              Designed from first principles to handle the immense volume of Indian celebrations with lightning speed and zero egress costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: Zero-Egress R2 */}
            <div className="group rounded-3xl p-8 bg-stone-900/60 backdrop-blur-md border border-amber-500/20 hover:border-amber-400/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <HardDrive className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest mb-1">
                  Zero Bandwidth Bills
                </div>
                <h3 className="font-heading font-bold text-2xl text-white">Direct-to-R2</h3>
                <p className="text-stone-400 text-sm mt-3 leading-relaxed">
                  Photos upload directly from photographer laptops to Cloudflare R2 via presigned URLs. No server bottlenecks, zero egress bandwidth bills.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-800 text-xs font-mono text-amber-300/80 flex items-center justify-between">
                <span>Presigned S3 API</span>
                <span className="text-emerald-400">₹0 Egress</span>
              </div>
            </div>

            {/* Pillar 2: Vector Matching */}
            <div className="group rounded-3xl p-8 bg-stone-900/60 backdrop-blur-md border border-rose-500/20 hover:border-rose-400/60 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-rose-400" />
                </div>
                <div className="text-[11px] font-mono text-rose-400 uppercase tracking-widest mb-1">
                  Biometric Precision
                </div>
                <h3 className="font-heading font-bold text-2xl text-white">Vector Matching</h3>
                <p className="text-stone-400 text-sm mt-3 leading-relaxed">
                  512-dimensional ArcFace mathematical vectors with dual PostgreSQL pgvector HNSW indexing and high-speed NumPy vectorized in-memory search.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-800 text-xs font-mono text-rose-300/80 flex items-center justify-between">
                <span>HNSW Index</span>
                <span className="text-emerald-400">&lt; 38ms Match</span>
              </div>
            </div>

            {/* Pillar 3: WhatsApp Native */}
            <div className="group rounded-3xl p-8 bg-stone-900/60 backdrop-blur-md border border-emerald-500/20 hover:border-emerald-400/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest mb-1">
                  India&apos;s #1 Channel
                </div>
                <h3 className="font-heading font-bold text-2xl text-white">WhatsApp Native</h3>
                <p className="text-stone-400 text-sm mt-3 leading-relaxed">
                  Direct integration with Meta&apos;s WhatsApp Cloud API. Send branded, personalized photo gallery links directly to guests on India&apos;s favorite messaging app.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-800 text-xs font-mono text-emerald-300/80 flex items-center justify-between">
                <span>Meta Cloud API v20</span>
                <span className="text-emerald-400">99% Delivery</span>
              </div>
            </div>

            {/* Pillar 4: DPDP Act 2023 */}
            <div className="group rounded-3xl p-8 bg-stone-900/60 backdrop-blur-md border border-amber-500/20 hover:border-amber-400/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-amber-300" />
                </div>
                <div className="text-[11px] font-mono text-amber-300 uppercase tracking-widest mb-1">
                  100% Law Compliant
                </div>
                <h3 className="font-heading font-bold text-2xl text-white">DPDP Act 2023</h3>
                <p className="text-stone-400 text-sm mt-3 leading-relaxed">
                  Affirmative biometric consent, automated 30-day RAW purges, 60-day complete biometric vector deletion, and instant one-click Right to Erasure.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-800 text-xs font-mono text-amber-300/80 flex items-center justify-between">
                <span>AES-256 Vector Vault</span>
                <span className="text-emerald-400">Zero Risk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Real Indian Photographer Stories (Warm Testimonials) */}
      <section className="relative z-10 py-28 bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-800 border border-amber-200">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              Trusted Across India
            </span>
            <h2 className="font-heading font-bold text-4xl sm:text-5xl text-[#1A120B] mt-4 tracking-tight">
              Loved by India&apos;s finest wedding cinematographers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1: Jaipur */}
            <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-1 mb-4 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-[#5A4F44] text-sm leading-relaxed italic">
                &quot;Guests were literally showing their photos to their relatives during dinner! The WhatsApp delivery created pandemonium in the best way. Zero complaints about delayed Google Drive links.&quot;
              </p>
              <div className="mt-6 pt-5 border-t border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-base text-[#1A120B]">Vikramaditya Rathore</p>
                  <p className="text-xs text-[#8A7E73]">Royal Heritage Shoots · Jaipur</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  42 Weddings
                </span>
              </div>
            </div>

            {/* Review 2: Mumbai */}
            <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-1 mb-4 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-[#5A4F44] text-sm leading-relaxed italic">
                &quot;We used to pay ₹18,000 every month on AWS bandwidth just from family members downloading RAW galleries. EventLens zero-egress R2 saved us lakhs. The ₹1,499 per-event fee is a no-brainer.&quot;
              </p>
              <div className="mt-6 pt-5 border-t border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-base text-[#1A120B]">Ananya Kulkarni</p>
                  <p className="text-xs text-[#8A7E73]">Soul &amp; Shutter Studios · Mumbai</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  65 Weddings
                </span>
              </div>
            </div>

            {/* Review 3: Bengaluru */}
            <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-1 mb-4 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-[#5A4F44] text-sm leading-relaxed italic">
                &quot;The face match handles ghunghat, turbans, and low-light sangeet dance floors without breaking a sweat. Couples now demand EventLens as an add-on package in our contracts.&quot;
              </p>
              <div className="mt-6 pt-5 border-t border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-base text-[#1A120B]">Karthik Subramanian</p>
                  <p className="text-xs text-[#8A7E73]">Candid South Weddings · Bengaluru</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  51 Weddings
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Transparent Per-Event Economics (Warm Champagne & Gold Pricing) */}
      <section id="pricing" className="relative z-10 py-32 bg-[#FAF8F5] border-t border-amber-200/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300">
              Transparent Pricing · No Lock-In
            </span>
            <h2 className="font-heading font-bold text-4xl sm:text-6xl text-[#1A120B] mt-4 tracking-tight">
              Pay per event.{" "}
              <span className="italic bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 bg-clip-text text-transparent">
                Never per month.
              </span>
            </h2>
            <p className="text-[#6B5E52] text-base sm:text-lg mt-4 leading-relaxed font-sans">
              Weddings in India are seasonal. Why pay thousands every month during off-season? With EventLens, you pay only when you shoot an event.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1: Starter */}
            <div className="rounded-3xl p-8 border border-amber-200/80 bg-white flex flex-col justify-between hover:shadow-lg hover:border-amber-300 transition-all">
              <div>
                <span className="text-xs font-mono text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
                  Starter
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-5xl text-[#1A120B]">₹799</span>
                  <span className="text-xs text-[#786E65]">/event</span>
                </div>
                <p className="text-xs text-[#6B5E52] mt-2">Birthdays, engagements &amp; intimate gatherings.</p>

                <ul className="mt-8 space-y-3 text-sm text-[#1A120B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>10 GB</strong> storage (~2,000 photos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>AI Face Search for all guests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Custom Table QR Code generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>30 Days gallery retention</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-100">
                <Link
                  href="/signup"
                  className="w-full block text-center rounded-full py-3 text-sm font-medium border border-amber-800 text-amber-900 hover:bg-amber-900 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Tier 2: Standard (Highlighted with Champagne Gold Glow) */}
            <div className="rounded-3xl p-8 border-2 border-amber-500 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 flex flex-col justify-between shadow-xl shadow-amber-500/15 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-[11px] font-sans tracking-wide uppercase font-semibold shadow-md">
                ★ Most Popular in India
              </div>

              <div>
                <span className="text-xs font-mono text-amber-900 uppercase tracking-wider bg-amber-100/80 px-2 py-1 rounded border border-amber-300">
                  Standard Wedding
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-5xl text-[#1A120B]">₹1,499</span>
                  <span className="text-xs text-[#786E65]">/event</span>
                </div>
                <p className="text-xs text-[#6B5E52] mt-2">Single-day weddings &amp; major family celebrations.</p>

                <ul className="mt-8 space-y-3 text-sm text-[#1A120B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>25 GB</strong> storage (~5,000 photos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>AI Face Search for all guests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>300 WhatsApp Alerts</strong> included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Custom Table QR tent cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>30 Days gallery retention</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200">
                <Link
                  href="/signup"
                  className="w-full block text-center rounded-full py-3.5 text-sm font-medium bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white hover:shadow-lg hover:shadow-amber-600/30 hover:scale-[1.02] transition-all shadow-md"
                >
                  Choose Standard
                </Link>
              </div>
            </div>

            {/* Tier 3: Grand (Rose Gold Accent) */}
            <div className="rounded-3xl p-8 border border-rose-200/80 bg-white flex flex-col justify-between hover:shadow-lg hover:border-rose-300 transition-all">
              <div>
                <span className="text-xs font-mono text-rose-800 uppercase tracking-wider bg-rose-50 px-2 py-1 rounded border border-rose-200/60">
                  Grand Royale
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-5xl text-[#1A120B]">₹2,499</span>
                  <span className="text-xs text-[#786E65]">/event</span>
                </div>
                <p className="text-xs text-[#6B5E52] mt-2">Multi-day luxury weddings &amp; royal receptions.</p>

                <ul className="mt-8 space-y-3 text-sm text-[#1A120B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>60 GB</strong> storage (~12,000 photos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>AI Face Search for all guests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>800 WhatsApp Alerts</strong> included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Priority background face indexing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>30 Days gallery retention</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-rose-100">
                <Link
                  href="/signup"
                  className="w-full block text-center rounded-full py-3 text-sm font-medium border border-rose-800 text-rose-900 hover:bg-rose-900 hover:text-white transition-colors"
                >
                  Choose Grand
                </Link>
              </div>
            </div>

            {/* Tier 4: Enterprise (Midnight Luxury) */}
            <div className="rounded-3xl p-8 border border-stone-800 bg-[#12100E] text-white flex flex-col justify-between hover:shadow-xl hover:border-amber-500/50 transition-all">
              <div>
                <span className="text-xs font-mono text-amber-300 uppercase tracking-wider bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30">
                  Enterprise VIP
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-5xl text-amber-400">₹4,999</span>
                  <span className="text-xs text-stone-400">/event</span>
                </div>
                <p className="text-xs text-stone-300 mt-2">Destination weddings &amp; mega royal festivals.</p>

                <ul className="mt-8 space-y-3 text-sm text-stone-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>150 GB</strong> storage (~30,000 photos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Unlimited AI Face Searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>2,000 WhatsApp Alerts</strong> included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dedicated high-speed worker pool</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>60 Days gallery retention</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-800">
                <Link
                  href="/signup"
                  className="w-full block text-center rounded-full py-3 text-sm font-medium bg-amber-500 text-stone-950 font-semibold hover:bg-amber-400 transition-colors shadow-md"
                >
                  Choose Enterprise
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-[#786E65] flex flex-wrap items-center justify-center gap-6">
            <span className="flex items-center gap-1.5 text-amber-900 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Razorpay UPI &amp; Cards accepted
            </span>
            <span className="flex items-center gap-1.5 text-amber-900 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Instant activation upon payment
            </span>
            <span className="flex items-center gap-1.5 text-amber-900 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Zero setup or cancellation fees
            </span>
          </div>
        </div>
      </section>

      {/* Section 7: Final CTA (Warm Sunset Ambient Canvas) */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-[#FAF8F5] via-[#FFF5E6] to-[#FAF8F5] text-center border-t border-amber-200/60 overflow-hidden">
        {/* Golden Bokeh Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-400/20 via-rose-400/20 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Begin Your Story
          </span>
          <h2 className="font-heading font-bold text-5xl sm:text-7xl text-[#1A120B] mt-4 leading-tight">
            Elevate your wedding photography. <br />
            <span className="italic bg-gradient-to-r from-amber-700 via-rose-600 to-amber-800 bg-clip-text text-transparent">
              Delight every single guest.
            </span>
          </h2>
          <p className="text-[#6B5E52] text-base sm:text-lg mt-6 max-w-xl mx-auto font-sans leading-relaxed">
            Join hundreds of visionary Indian photographers delivering jaw-dropping client experiences with zero monthly contracts.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-block rounded-full px-12 py-4 sm:px-14 sm:py-5 text-base font-medium bg-[#14100C] text-[#FFFFFF] hover:bg-gradient-to-r hover:from-amber-600 hover:to-amber-800 hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-amber-950/20"
            >
              Begin Journey
            </Link>
            <Link
              href="/login"
              className="inline-block rounded-full px-8 py-4 sm:py-5 text-base font-medium text-amber-900 hover:text-amber-700 transition-colors"
            >
              Sign In to Existing Event →
            </Link>
          </div>

          <p className="text-xs text-[#8A7E73] mt-6">
            Free trial available · No credit card required · Instant setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-amber-100 py-16 text-sm text-[#786E65]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-heading font-bold text-2xl text-[#1A120B]">
              EventLens<sup className="text-xs font-sans text-amber-600">®</sup>
            </span>
            <p className="text-xs text-[#786E65] mt-1 font-sans">
              AI Event Photo Delivery Platform · Designed for Indian Photographers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-xs font-sans">
            <Link href="#how-it-works" className="hover:text-amber-800 transition-colors">How It Works</Link>
            <Link href="#showcase" className="hover:text-amber-800 transition-colors">Showcase</Link>
            <Link href="#pricing" className="hover:text-amber-800 transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-amber-800 transition-colors">DPDP Act Compliance</Link>
            <Link href="/login" className="hover:text-amber-800 transition-colors">Photographer Login</Link>
            <Link href="/signup" className="hover:text-amber-800 transition-colors">Register</Link>
          </div>

          <p className="text-xs text-[#786E65] font-mono">
            © {new Date().getFullYear()} EventLens Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
