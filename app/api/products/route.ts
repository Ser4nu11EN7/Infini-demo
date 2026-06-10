import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePrice, validateCurrency } from "@/lib/validate";

const productSchema = z.object({
  name: z.string().trim().min(1).max(100),
  price: z.string().trim(),
  currency: z.string().optional(),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Invalid product data." },
      { status: 400 }
    );
  }

  try {
    const currency = validateCurrency(parsed.data.currency);
    const price = normalizePrice(parsed.data.price);
    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        price,
        currency,
        description: parsed.data.description,
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Could not create product.",
      },
      { status: 400 }
    );
  }
}
