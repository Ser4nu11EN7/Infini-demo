import { NextResponse } from "next/server";
import { z } from "zod";
import { parsePaymentRequest } from "@/lib/ai";
import { trackEvent, trackingFromHeaders } from "@/lib/track";

const parseSchema = z.object({
  text: z.string(),
});

type ParseResult = Awaited<ReturnType<typeof parsePaymentRequest>>;

const PARSE_CACHE_TTL_MS = 5 * 60 * 1000;
const PARSE_CACHE_MAX_ENTRIES = 100;
const PARSE_CACHE_VERSION = "prompt-currency-cny-usd-v5";
const parseCache = new Map<string, { result: ParseResult; expiresAt: number }>();

function cacheKeyForInput(input: string) {
  return `${PARSE_CACHE_VERSION}:${input.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

function getCachedParse(input: string) {
  const key = cacheKeyForInput(input);
  const cached = parseCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    parseCache.delete(key);
    return null;
  }
  return cached.result;
}

function setCachedParse(input: string, result: ParseResult) {
  const key = cacheKeyForInput(input);
  parseCache.set(key, {
    result,
    expiresAt: Date.now() + PARSE_CACHE_TTL_MS,
  });

  if (parseCache.size > PARSE_CACHE_MAX_ENTRIES) {
    const oldestKey = parseCache.keys().next().value;
    if (oldestKey) {
      parseCache.delete(oldestKey);
    }
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseSchema.safeParse(body);
  const tracking = trackingFromHeaders(request.headers);

  if (!parsed.success) {
    await trackEvent({
      ...tracking,
      name: "parse_failed",
      properties: { errorCode: "INVALID_BODY" },
    });
    return NextResponse.json(
      { ok: false, reason: "Please enter a product and price." },
      { status: 400 }
    );
  }

  try {
    const cachedResult = getCachedParse(parsed.data.text);
    if (cachedResult) {
      await trackEvent({
        ...tracking,
        name: cachedResult.ok ? "parse_succeeded" : "parse_failed",
        properties: cachedResult.ok
          ? {
              cached: true,
              currency: cachedResult.currency,
              amount: cachedResult.price,
            }
          : {
              cached: true,
              errorCode: cachedResult.reasonCode || "AI_PARSE_FAILED",
              reason: cachedResult.reason,
            },
      });

      return NextResponse.json(
        { ...cachedResult, cached: true },
        { status: cachedResult.ok ? 200 : 422 }
      );
    }

    const result = await parsePaymentRequest(parsed.data.text);
    setCachedParse(parsed.data.text, result);
    await trackEvent({
      ...tracking,
      name: result.ok ? "parse_succeeded" : "parse_failed",
      properties: result.ok
        ? { currency: result.currency, amount: result.price }
        : { errorCode: "AI_PARSE_FAILED", reason: result.reason },
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    console.error("AI parse provider error:", error);
    await trackEvent({
      ...tracking,
      name: "parse_failed",
      properties: {
        errorCode: "AI_PROVIDER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        reason: "Product extraction is temporarily unavailable. Please try again.",
        reasonCode: "AI_PROVIDER_ERROR",
      },
      { status: 502 }
    );
  }
}
