import crypto from "crypto";

type InfiniEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
} & T;

export type InfiniCreateOrderData = {
  checkout_url: string;
  order_id: string;
  token?: string;
};

export type InfiniQueryOrderData = {
  order_id: string;
  status?: string;
  pay_status?: string;
  client_reference?: string;
};

type CreateOrderInput = {
  amount: string;
  currency: string;
  requestId: string;
  orderDesc: string;
  successUrl: string;
  failureUrl: string;
  clientReference: string;
};

function getInfiniConfig() {
  const host = process.env.INFINI_BASE_HOST || "openapi-sandbox.infini.money";
  const keyId = process.env.INFINI_KEY_ID;
  const secretKey = process.env.INFINI_SECRET_KEY;

  if (!keyId || !secretKey) {
    throw new Error("INFINI_KEY_ID and INFINI_SECRET_KEY are required.");
  }

  return { host, keyId, secretKey };
}

function signRequest(method: string, path: string, body?: string) {
  const { keyId, secretKey } = getInfiniConfig();
  const gmtTime = new Date().toUTCString();
  const signingString = `${keyId}\n${method} ${path}\ndate: ${gmtTime}\n`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signingString)
    .digest("base64");

  const headers: Record<string, string> = {
    Date: gmtTime,
    Authorization: `Signature keyId="${keyId}",algorithm="hmac-sha256",headers="@request-target date",signature="${signature}"`,
  };

  if (body) {
    const digest = crypto.createHash("sha256").update(body, "utf-8").digest("base64");
    headers["Digest"] = `SHA-256=${digest}`;
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function infiniRequest<T>(
  method: "GET" | "POST",
  path: string,
  payload?: unknown
): Promise<T> {
  const { host } = getInfiniConfig();
  const body = payload ? JSON.stringify(payload) : undefined;
  const response = await fetch(`https://${host}${path}`, {
    method,
    headers: signRequest(method, path, body),
    body,
    cache: "no-store",
  });

  const rawText = await response.text();
  let json: InfiniEnvelope<T>;
  try {
    json = JSON.parse(rawText) as InfiniEnvelope<T>;
  } catch {
    throw new Error(`Infini returned non-JSON response: HTTP ${response.status}`);
  }

  if (!response.ok || (typeof json.code === "number" && json.code !== 0)) {
    throw new Error(json.message || `Infini request failed with HTTP ${response.status}`);
  }

  return (json.data ?? json) as T;
}

export async function createInfiniOrder(input: CreateOrderInput) {
  return infiniRequest<InfiniCreateOrderData>("POST", "/v1/acquiring/order", {
    amount: input.amount,
    currency: input.currency,
    request_id: input.requestId,
    order_desc: input.orderDesc,
    success_url: input.successUrl,
    failure_url: input.failureUrl,
    client_reference: input.clientReference,
    pay_methods: [1],
  });
}

export async function queryInfiniOrder(orderId: string) {
  const path = `/v1/acquiring/order?order_id=${encodeURIComponent(orderId)}`;
  return infiniRequest<InfiniQueryOrderData>("GET", path);
}

export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  eventId: string | null,
  signature: string | null
) {
  const secret = process.env.INFINI_WEBHOOK_SECRET;
  if (!secret || !timestamp || !eventId || !signature) {
    return false;
  }

  const content = `${timestamp}.${eventId}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(content).digest("hex");
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
