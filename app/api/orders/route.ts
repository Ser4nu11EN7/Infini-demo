import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createInfiniOrder } from "@/lib/infini";
import { trackEvent, trackingFromHeaders } from "@/lib/track";
import { getPublicBaseUrl } from "@/lib/validate";

const createOrderSchema = z.object({
  productId: z.string().min(1),
  clientRequestId: z.string().min(8).max(120).optional(),
});

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Could not load orders:", error);
    return NextResponse.json(
      { ok: false, reason: "Could not load orders." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  const tracking = trackingFromHeaders(request.headers);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Invalid order request." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) {
    return NextResponse.json({ ok: false, reason: "Product not found." }, { status: 404 });
  }

  const requestId = parsed.data.clientRequestId ?? randomUUID();
  const existingByRequest = await prisma.order.findUnique({ where: { requestId } });
  if (existingByRequest?.checkoutUrl) {
    return NextResponse.json({
      ok: true,
      orderId: existingByRequest.id,
      checkout_url: existingByRequest.checkoutUrl,
      reused: true,
    });
  }
  if (existingByRequest?.status === "creating") {
    return NextResponse.json(
      { ok: false, reason: "Order creation is already in progress." },
      { status: 409 }
    );
  }
  if (existingByRequest) {
    return NextResponse.json(
      { ok: false, reason: "This checkout request already exists." },
      { status: 409 }
    );
  }

  let order = await prisma.order.create({
    data: {
      productId: product.id,
      requestId,
      amount: product.price,
      currency: product.currency,
      status: "creating",
    },
  });

  await trackEvent({
    ...tracking,
    name: "order_create_started",
    orderId: order.id,
    productId: product.id,
    properties: { amount: product.price.toString(), currency: product.currency },
  });

  try {
    const baseUrl = getPublicBaseUrl();
    const successUrl = `${baseUrl}/success?orderId=${encodeURIComponent(order.id)}`;
    const failureUrl = `${baseUrl}/demo?failedOrderId=${encodeURIComponent(order.id)}`;
    const infiniOrder = await createInfiniOrder({
      amount: product.price.toString(),
      currency: product.currency,
      requestId,
      orderDesc: product.name,
      successUrl,
      failureUrl,
      clientReference: order.id,
    });

    order = await prisma.order.update({
      where: { id: order.id },
      data: {
        infiniOrderId: infiniOrder.order_id,
        checkoutUrl: infiniOrder.checkout_url,
        status: "pending",
        rawStatus: "pending",
      },
    });

    await trackEvent({
      ...tracking,
      name: "order_create_succeeded",
      orderId: order.id,
      productId: product.id,
      properties: { amount: product.price.toString(), currency: product.currency },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      checkout_url: infiniOrder.checkout_url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create Infini checkout order.";
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "failed", errorMessage: message },
    });
    await trackEvent({
      ...tracking,
      name: "order_create_failed",
      orderId: order.id,
      productId: product.id,
      properties: { errorCode: "INFINI_CREATE_FAILED", message },
    });

    return NextResponse.json({ ok: false, reason: message }, { status: 502 });
  }
}
