import Decimal from "decimal.js";
import type { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const supportedCurrencies = ["USD"] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];

const pricePattern = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const chineseNumberPattern = "[零〇一二两三四五六七八九十百千万]+";
const unsupportedCurrencyCodes =
  "CNY|RMB|JPY|EUR|GBP|BTC|BITCOIN|ETH|ETHEREUM|USDT|USDC|SOL|BNB";
const unsupportedCurrencyWords =
  "人民币|软妹币|元|块|块钱|日元|欧元|英镑|比特币|以太坊|泰达币|稳定币";
const unsupportedCurrencyPricePattern = new RegExp(
  [
    String.raw`(?:[¥€£]|(?:${unsupportedCurrencyCodes})\b)\s*\d+(?:\.\d+)?`,
    String.raw`\d+(?:\.\d+)?\s*(?:个|枚)?\s*(?:[¥€£]|${unsupportedCurrencyCodes})\b`,
    String.raw`\d+(?:\.\d+)?\s*(?:个|枚)?\s*(?:${unsupportedCurrencyWords})`,
    String.raw`${chineseNumberPattern}\s*(?:${unsupportedCurrencyWords})`,
  ].join("|"),
  "i"
);
const dollarWordsPattern = "美元|美金|刀|刀乐";
const supportedDollarPricePattern = new RegExp(
  [
    String.raw`(?:\$|USD\s*)\s*\d+(?:\.\d+)?`,
    String.raw`\d+(?:\.\d+)?\s*(?:dollars?|bucks?|USD\b|${dollarWordsPattern})`,
    String.raw`${chineseNumberPattern}\s*(?:${dollarWordsPattern})`,
  ].join("|"),
  "i"
);

export const naturalLanguageSchema = z
  .string()
  .trim()
  .min(3, "Describe what you want to sell.")
  .max(500, "Keep the request under 500 characters.");

export function validateRawRequestForPayment(input: string) {
  if (
    unsupportedCurrencyPricePattern.test(input) &&
    !supportedDollarPricePattern.test(input)
  ) {
    throw new Error("Product pricing supports USD only.");
  }

  const overPreciseDollar = new RegExp(
    String.raw`(?:\$|USD\s*)\s*\d+(?:\.\d{7,})|\d+(?:\.\d{7,})\s*(?:dollars?|bucks?|USD\b|${dollarWordsPattern})`,
    "i"
  );
  if (overPreciseDollar.test(input)) {
    throw new Error("Price can have at most 6 decimal places.");
  }

  const negativePrice = new RegExp(
    String.raw`(?:-\s*(?:\$|USD\s*)\d+)|(?:-\s*\d+(?:\.\d+)?\s*(?:dollars?|bucks?|USD\b|${dollarWordsPattern}))`,
    "i"
  );
  if (negativePrice.test(input)) {
    throw new Error("Price must be greater than zero.");
  }

  const amountMatches = input.matchAll(
    new RegExp(
      String.raw`(?:\$|USD\s*)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars?|bucks?|USD\b|${dollarWordsPattern})`,
      "gi"
    )
  );
  for (const match of amountMatches) {
    const rawAmount = match[1] || match[2];
    if (rawAmount && new Decimal(rawAmount).gt(100000)) {
      throw new Error("Price must be 100000 USD or less.");
    }
  }
}

export const aiExtractionSchema = z.object({
  productName: z.string().trim().min(1).max(100),
  price: z.string().trim().regex(pricePattern, "Price must be a positive decimal string."),
  currency: z.string().trim().optional(),
});

export type ValidatedExtraction = {
  productName: string;
  price: string;
  currency: SupportedCurrency;
};

export function validateCurrency(currency: string | undefined): SupportedCurrency {
  const normalized = (currency || "USD").toUpperCase();
  if (!supportedCurrencies.includes(normalized as SupportedCurrency)) {
    throw new Error("Product pricing supports USD only.");
  }
  return normalized as SupportedCurrency;
}

export function normalizePrice(price: string): string {
  if (!pricePattern.test(price)) {
    throw new Error("Price must be a positive decimal with up to 6 decimal places.");
  }

  const decimal = new Decimal(price);
  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new Error("Price must be greater than zero.");
  }
  if (decimal.gt(100000)) {
    throw new Error("Price must be 100000 or less.");
  }

  return decimal.toFixed(Math.min(decimal.decimalPlaces(), 6));
}

export function validateAiExtraction(value: unknown): ValidatedExtraction {
  const parsed = aiExtractionSchema.parse(value);
  const currency = validateCurrency(parsed.currency);
  const price = normalizePrice(parsed.price);

  return {
    productName: parsed.productName,
    price,
    currency,
  };
}

export function normalizeInfiniStatus(status: string | null | undefined) {
  const rawStatus = status || "pending";
  const allowed = new Set<OrderStatus>([
    "pending",
    "processing",
    "paid",
    "partial_paid",
    "expired",
  ]);

  return {
    rawStatus,
    status: allowed.has(rawStatus as OrderStatus)
      ? (rawStatus as OrderStatus)
      : ("processing" as OrderStatus),
  };
}

export function getPublicBaseUrl() {
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is required to build checkout redirect URLs.");
  }
  return baseUrl;
}
