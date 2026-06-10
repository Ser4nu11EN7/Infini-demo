import crypto from "node:crypto";
import fs from "node:fs";

if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const secret = process.env.INFINI_WEBHOOK_SECRET;
const orderId = process.argv[2];

if (!secret || !orderId) {
  console.error("Usage: INFINI_WEBHOOK_SECRET=... node scripts/mock-webhook.mjs <localOrderId>");
  process.exit(1);
}

const eventId = crypto.randomUUID();
const timestamp = String(Math.floor(Date.now() / 1000));
const payload = JSON.stringify({
  event: "order.completed",
  order_id: `mock-${orderId}`,
  client_reference: orderId,
  amount: "10",
  currency: "USD",
  status: "paid",
  amount_confirmed: "10",
  amount_confirming: "0",
  created_at: Number(timestamp),
  updated_at: Number(timestamp),
});
const signature = crypto
  .createHmac("sha256", secret)
  .update(`${timestamp}.${eventId}.${payload}`)
  .digest("hex");

const response = await fetch(`${baseUrl}/api/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Timestamp": timestamp,
    "X-Webhook-Event-Id": eventId,
    "X-Webhook-Signature": signature,
  },
  body: payload,
});

console.log(response.status, await response.text());
