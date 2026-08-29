import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a monetary amount (KES by default) — e.g. "KSh 45,000" */
export function formatMoney(
  amount: number | null | undefined,
  currency = "KES",
  locale = "en-KE"
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatCompactMoney(
  amount: number | null | undefined,
  currency = "KES"
): string {
  const value = amount ?? 0;
  if (value >= 1_000_000) return `KSh ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KSh ${Math.round(value / 1_000)}K`;
  return `KSh ${Math.round(value)}`;
}

/** Format a date in the platform timezone — "12 Aug 2026" */
export function formatDate(
  value: string | Date | null | undefined,
  timezone = "Africa/Nairobi"
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  try {
    return new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: timezone,
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/** Format a datetime — "12 Aug 2026, 2:30 PM" */
export function formatDateTime(
  value: string | Date | null | undefined,
  timezone = "Africa/Nairobi"
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  try {
    return new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/** Relative time — "2 hours ago" */
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(d);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
