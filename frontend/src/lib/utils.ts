import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatMb(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export type EventStatusType = "created" | "live" | "active" | "archived" | "deleted";

export function getStatusBadge(status: EventStatusType) {
  switch (status) {
    case "live":
      return {
        label: "LIVE EVENT",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 border",
        isLive: true,
      };
    case "active":
      return {
        label: "Active",
        className: "bg-blue-50 text-blue-700 border-blue-200 border",
        isLive: false,
      };
    case "archived":
      return {
        label: "Archived",
        className: "bg-amber-50 text-amber-700 border-amber-200 border",
        isLive: false,
      };
    case "deleted":
      return {
        label: "Purged",
        className: "bg-rose-50 text-rose-700 border-rose-200 border",
        isLive: false,
      };
    default:
      return {
        label: "Draft",
        className: "bg-slate-100 text-slate-700 border-slate-200 border",
        isLive: false,
      };
  }
}
