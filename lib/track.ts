import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type TrackingContext = {
  anonymousId?: string | null;
  sessionId?: string | null;
};

type TrackEventInput = TrackingContext & {
  eventId?: string;
  name: string;
  orderId?: string | null;
  productId?: string | null;
  properties?: unknown;
};

export function trackingFromHeaders(headers: Headers): TrackingContext {
  return {
    anonymousId: headers.get("x-anonymous-id"),
    sessionId: headers.get("x-session-id"),
  };
}

export async function trackEvent(input: TrackEventInput) {
  try {
    await prisma.event.create({
      data: {
        eventId: input.eventId ?? randomUUID(),
        anonymousId: input.anonymousId || undefined,
        sessionId: input.sessionId || undefined,
        name: input.name,
        orderId: input.orderId || undefined,
        productId: input.productId || undefined,
        properties: input.properties as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    console.warn("Tracking failed:", error);
  }
}
