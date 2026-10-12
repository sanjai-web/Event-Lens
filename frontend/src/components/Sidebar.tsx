"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  HardDrive,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Camera,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  profile?: {
    name?: string;
    business_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  storageUsedMb?: number;
  storageLimitMb?: number;
}

export default function Sidebar({
  profile,
  storageUsedMb = 0,
  storageLimitMb = 25000,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("eventlens_token");
    localStorage.removeItem("eventlens_refresh_token");
    router.push("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Create Event",
      href: "/events/new",
      icon: PlusCircle,
      active: pathname === "/events/new",
    },
    {
      label: "DPDP Compliance",
      href: "/privacy",
      icon: ShieldCheck,
      active: pathname === "/privacy",
    },
  ];

  const storagePct = Math.min(
    100,
    Math.round((storageUsedMb / Math.max(1, storageLimitMb)) * 100)
  );

  return (
    <>
      {/* Mobile Top Header with Menu Button */}
      <div className="lg:hidden sticky top-0 z-30 w-full bg-[#FAF8F5] border-b border-amber-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-[#1A120B]">
            EventLens<sup className="text-[10px] font-sans text-amber-600 font-normal ml-0.5">®</sup>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50 border border-amber-200/60 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#1A120B]/40 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Content (Desktop: fixed/sticky left side; Mobile: slide-out drawer) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#FAF8F5] border-r border-amber-100 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: Logo & Nav items */}
        <div className="p-5 flex flex-col flex-1 overflow-y-auto">
          {/* Logo Branding */}
          <div className="pb-5 mb-5 border-b border-amber-100/70">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-center shadow-md shadow-amber-900/15 group-hover:scale-105 transition-all">
                <Camera className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-xl tracking-tight text-[#1A120B]">
                    EventLens<sup className="text-[10px] font-sans text-amber-600 font-normal">®</sup>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100/80 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200/60">
                    Studio
                  </span>
                </div>
                <span className="text-[11px] text-[#786E65] font-medium">
                  Photographer AI Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 flex-1">
            <p className="text-[10px] font-semibold text-[#8A7E73] uppercase tracking-wider px-3 mb-2 font-mono">
              Main Menu
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-amber-100/70 via-amber-50 to-white text-[#1A120B] font-semibold border-l-4 border-amber-600 shadow-xs"
                      : "text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4.5 h-4.5 ${
                        item.active ? "text-amber-700" : "text-[#8A7E73]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.active && <ChevronRight className="w-4 h-4 text-amber-600" />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-amber-100/70">
              <p className="text-[10px] font-semibold text-[#8A7E73] uppercase tracking-wider px-3 mb-2 font-mono">
                Portals & Links
              </p>
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#6B5E52] hover:text-[#1A120B] hover:bg-amber-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                  <span>Public Landing Page</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8A7E73]" />
              </Link>
            </div>
          </div>

          {/* R2 Cloudflare Zero-Egress Storage Meter */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-b from-white to-amber-50/40 border border-amber-200/60 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#1A120B]">
                <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                <span>Cloudflare R2</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Zero Egress
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden my-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePct > 85
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700"
                }`}
                style={{ width: `${Math.max(4, storagePct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#786E65] font-medium">
              <span>{(storageUsedMb / 1024).toFixed(1)} GB used</span>
              <span>{(storageLimitMb / 1024).toFixed(0)} GB tier</span>
            </div>
          </div>
        </div>

        {/* Bottom: Photographer Profile & Logout */}
        <div className="p-4 border-t border-amber-100 bg-[#FAF8F5]">
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/50 hover:border-amber-300 transition-colors bg-white/80 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-center font-heading text-xs font-bold shrink-0 shadow-xs">
                {(profile?.name || "P").charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#1A120B] truncate">
                  {profile?.business_name || profile?.name || "Photographer Studio"}
                </p>
                <p className="text-[11px] text-[#786E65] truncate">
                  {profile?.email || "photographer@eventlens.in"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-[#8A7E73] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
