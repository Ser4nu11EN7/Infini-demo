import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent, trackingFromHeaders } from "@/lib/track";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function reviewerToolsEnabled() {
  return process.env.ENABLE_REVIEWER_TOOLS === "true";
}

export async function POST(request: Request, context: RouteContext) {
  if (!reviewerToolsEnabled()) {
    return NextResponse.json({ ok: false, reason: "Not found." }, { status: 404 });
  }

  const { id } = await context.params;
  const tracking = trackingFromHeaders(request.headers);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, reason: "Order not found." }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ ok: true, order });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      rawStatus: "simulated_paid",
    },
    include: { product: true },
  });

  await trackEvent({
    ...tracking,
    eventId: `reviewer_payment_simulated:${order.id}`,
    name: "reviewer_payment_simulated",
    orderId: order.id,
    productId: order.productId,
    properties: {
      amount: order.amount.toString(),
      currency: order.currency,
      source: "reviewer_tool",
    },
  });

  return NextResponse.json({ ok: true, order: updated });
}
