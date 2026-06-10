import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/track";

const eventSchema = z.object({
  eventId: z.string().min(8).max(120),
  anonymousId: z.string().max(160).optional(),
  sessionId: z.string().max(160).optional(),
  name: z.string().min(2).max(80),
  orderId: z.string().optional(),
  productId: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await trackEvent(parsed.data);
  return NextResponse.json({ ok: true });
}
