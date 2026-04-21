import { clsx, type ClassValue } from "clsx";

import type { JsonValue, SiteContentEntry } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getSiteContentValue(
  entries: SiteContentEntry[],
  section: string,
  fallback: JsonValue = "",
) {
  return entries.find((entry) => entry.section === section)?.content ?? fallback;
}

export function formatDuration(seconds: number) {
  if (!seconds) {
    return "0m";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
