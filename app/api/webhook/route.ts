import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/infini";
import { trackEvent } from "@/lib/track";
import { normalizeInfiniStatus } from "@/lib/validate";

function pickWebhookData(payload: Record<string, unknown>) {
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;

  return {
    orderId: String(data.order_id || data.infini_order_id || ""),
    clientReference: String(data.client_reference || ""),
    status: String(data.pay_status || data.status || ""),
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-webhook-timestamp");
  const eventId = request.headers.get("x-webhook-event-id");
  const signature = request.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, timestamp, eventId, signature)) {
    return NextResponse.json({ ok: false, reason: "Invalid signature." }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ ok: false, reason: "Missing event id." }, { status: 400 });
  }

  try {
    await prisma.processedWebhookEvent.create({ data: { eventId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const data = pickWebhookData(payload);
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        data.clientReference ? { id: data.clientReference } : undefined,
        data.orderId ? { infiniOrderId: data.orderId } : undefined,
      ].filter(Boolean) as { id?: string; infiniOrderId?: string }[],
    },
  });

  if (!order) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const normalized = normalizeInfiniStatus(data.status);
  const becamePaid = order.status !== "paid" && normalized.status === "paid";
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: normalized.status,
      rawStatus: normalized.rawStatus,
    },
  });

  if (becamePaid) {
    await trackEvent({
      eventId: `payment_paid_confirmed:${order.id}`,
      name: "payment_paid_confirmed",
      orderId: order.id,
      productId: order.productId,
      properties: {
        amount: order.amount.toString(),
        currency: order.currency,
        source: "webhook",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
