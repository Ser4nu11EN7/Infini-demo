import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queryInfiniOrder } from "@/lib/infini";
import { trackEvent, trackingFromHeaders } from "@/lib/track";
import { normalizeInfiniStatus } from "@/lib/validate";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const tracking = trackingFromHeaders(request.headers);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, reason: "Order not found." }, { status: 404 });
  }

  if (!order.infiniOrderId) {
    return NextResponse.json({ ok: true, order });
  }

  try {
    const remote = await queryInfiniOrder(order.infiniOrderId);
    const remoteStatus = remote.pay_status || remote.status;
    const normalized = normalizeInfiniStatus(remoteStatus);
    const nextStatus =
      order.status === "paid" && normalized.status !== "paid" ? order.status : normalized.status;
    const nextRawStatus =
      order.status === "paid" && normalized.status !== "paid"
        ? order.rawStatus || "paid"
        : normalized.rawStatus;
    const becamePaid = order.status !== "paid" && nextStatus === "paid";

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        rawStatus: nextRawStatus,
      },
      include: { product: true },
    });

    if (becamePaid) {
      await trackEvent({
        ...tracking,
        eventId: `payment_paid_confirmed:${order.id}`,
        name: "payment_paid_confirmed",
        orderId: order.id,
        productId: order.productId,
        properties: {
          amount: order.amount.toString(),
          currency: order.currency,
          source: "polling",
        },
      });
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        order,
        reason: error instanceof Error ? error.message : "Could not query order status.",
      },
      { status: 502 }
    );
  }
}
