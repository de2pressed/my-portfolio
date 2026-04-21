"use client";

import type { JsonValue } from "@/lib/types";

const CONSENT_KEY = "portfolio-cookie-consent";
const VISITOR_KEY = "portfolio-visitor-id";
const SESSION_KEY = "portfolio-session-start";

function canUseStorage() {
  try {
    localStorage.setItem("__portfolio_test__", "1");
    localStorage.removeItem("__portfolio_test__");
    return true;
  } catch {
    return false;
  }
}

function getVisitorId() {
  if (!canUseStorage()) {
    return null;
  }

  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) {
    return existing;
  }

  const value = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, value);
  return value;
}

export function hasAnalyticsConsent() {
  if (!canUseStorage()) {
    return false;
  }

  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

async function sendEvent(eventType: string, metadata: Record<string, JsonValue> = {}) {
  const visitorId = getVisitorId();
  if (!visitorId || !hasAnalyticsConsent()) {
    return;
  }

  const payload = JSON.stringify({
    event_type: eventType,
    visitor_id: visitorId,
    metadata,
  });

  if (eventType === "session_end" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }

  await fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: eventType === "session_end",
  });
}

export async function trackPageView(pathname: string) {
  await sendEvent("page_view", { pathname });
}

export async function trackSectionScroll(section: string) {
  await sendEvent("section_scroll", { section });
}

export async function trackSessionStart(pathname: string) {
  if (!canUseStorage() || !hasAnalyticsConsent()) {
    return;
  }

  localStorage.setItem(SESSION_KEY, String(Date.now()));
  await sendEvent("session_start", { pathname });
}

export async function trackSessionEnd(pathname: string) {
  if (!canUseStorage() || !hasAnalyticsConsent()) {
    return;
  }

  const startedAt = Number(localStorage.getItem(SESSION_KEY) ?? 0);
  const durationMs = startedAt > 0 ? Date.now() - startedAt : 0;
  await sendEvent("session_end", { pathname, duration_ms: durationMs });
}
