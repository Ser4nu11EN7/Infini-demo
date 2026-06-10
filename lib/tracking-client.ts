"use client";

type ClientTrackingIds = {
  anonymousId: string;
  sessionId: string;
};

const ANON_KEY = "infini_demo_anonymous_id";
const SESSION_KEY = "infini_demo_session";
const SESSION_TTL_MS = 30 * 60 * 1000;

function browserUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTrackingIds(): ClientTrackingIds {
  if (typeof window === "undefined") {
    return { anonymousId: "", sessionId: "" };
  }

  try {
    let anonymousId = window.localStorage.getItem(ANON_KEY);
    if (!anonymousId) {
      anonymousId = `anon_${browserUUID()}`;
      window.localStorage.setItem(ANON_KEY, anonymousId);
    }

    const now = Date.now();
    const stored = window.localStorage.getItem(SESSION_KEY);
    let session: { id: string; updatedAt: number } | null = null;
    if (stored) {
      try {
        session = JSON.parse(stored) as { id: string; updatedAt: number };
      } catch {
        session = null;
      }
    }

    if (!session || now - session.updatedAt > SESSION_TTL_MS) {
      session = { id: `sess_${browserUUID()}`, updatedAt: now };
    } else {
      session.updatedAt = now;
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { anonymousId, sessionId: session.id };
  } catch {
    return {
      anonymousId: `anon_${browserUUID()}`,
      sessionId: `sess_${browserUUID()}`,
    };
  }
}

export function trackingHeaders() {
  const ids = getTrackingIds();
  return {
    "x-anonymous-id": ids.anonymousId,
    "x-session-id": ids.sessionId,
  };
}

export function trackClientEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const ids = getTrackingIds();
  const payload = JSON.stringify({
    eventId: browserUUID(),
    name,
    ...ids,
    properties,
  });

  try {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(
        "/api/events",
        new Blob([payload], { type: "application/json" })
      );
      if (queued) {
        return;
      }
    }
  } catch {
    // Fall back to fetch below. Tracking should never break the demo UI.
  }

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
