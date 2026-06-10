# Infini AI Agent Payment Demo

**English** | [中文](README.zh-CN.md)

Turn a merchant's natural-language selling intent into an Infini hosted crypto checkout link.

Example:

```txt
I want to sell an AI report for $10
```

The app extracts the product and USD price with Claude, stores the product and order, creates an Infini checkout, and confirms payment status from the backend before showing the paid receipt.

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Prisma ORM + PostgreSQL
- Anthropic Claude Haiku for natural-language extraction
- Infini Hosted Checkout sandbox
- Lightweight local funnel tracking

## Project Structure

```txt
app/
  page.tsx                       Landing page
  demo/page.tsx                  Create payment link
  orders/page.tsx                Order history and payment status
  success/page.tsx               Payment status and receipt
  api/
    parse/route.ts               Claude extraction
    products/route.ts            Product creation
    orders/route.ts              Order list and checkout creation
    orders/[id]/status/route.ts  Backend payment status refresh
    webhook/route.ts             Infini webhook receiver
    events/route.ts              Client funnel events
lib/
  ai.ts                          Prompt, model call, failure mapping
  infini.ts                      Infini signing and requests
  validate.ts                    Schemas, price and currency validation
  db.ts                          Prisma client singleton
  track.ts                       Server event writing
  tracking-client.ts             Browser event sending
  i18n.tsx                       English and Chinese UI copy
prisma/schema.prisma             Data model
eval/run.mjs, eval/cases.json    AI extraction eval
scripts/mock-webhook.mjs         Signed local webhook sender
```

## Data Model

Defined in `prisma/schema.prisma`.

- **Product**: name, `Decimal(18,6)` price, currency, description, created time.
- **Order**: local order id, Infini order id, idempotent `requestId`, checkout URL, amount, currency, status, timestamps.
- **ProcessedWebhookEvent**: stores webhook event ids for idempotency.
- **Event**: anonymous id, session id, event name, optional order/product id, JSON properties.

Order statuses:

```txt
creating, pending, processing, paid, partial_paid, expired, failed
```

Once an order is `paid`, later polling or webhook updates never move it backward.

## API Routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/parse` | Extract product and price with Claude |
| POST | `/api/products` | Create product |
| POST | `/api/orders` | Create local order and Infini checkout |
| GET | `/api/orders` | List recent orders |
| GET | `/api/orders/[id]/status` | Refresh payment status |
| POST | `/api/webhook` | Receive Infini webhook |
| POST | `/api/events` | Record funnel events |

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill the values.

3. Create the local database schema:

   ```bash
   npm run prisma:migrate
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

Open:

```txt
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `APP_BASE_URL` | Yes | Public app URL used to build Infini `success_url` and `failure_url`. Local: `http://localhost:3000`; production: deployed Vercel URL. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `INFINI_BASE_HOST` | Yes | Infini API host. Sandbox default: `openapi-sandbox.infini.money`. |
| `INFINI_KEY_ID` | Yes | Infini API key id. |
| `INFINI_SECRET_KEY` | Yes | Infini request signing secret. |
| `INFINI_WEBHOOK_SECRET` | Yes | Secret for webhook signature verification. |
| `ANTHROPIC_API_KEY` | Yes | API key for Claude extraction. |
| `ANTHROPIC_MODEL` | No | Model name. Defaults to `claude-haiku-4-5`. |
| `ANTHROPIC_BASE_URL` | No | Optional Anthropic-compatible endpoint override. |
| `NEXT_PUBLIC_ENABLE_REVIEWER_TOOLS` | No | When `true`, shows a button that marks an order paid without a real on-chain transfer. See Reviewer Payment Path. Defaults to `false`. |

## Vercel Deployment

The repository is ready for Vercel.

1. Import the GitHub repository into Vercel.

2. Keep the build command as:

   ```bash
   npm run build
   ```

   `npm run build` runs:

   ```bash
   prisma generate && next build
   ```

3. Create a PostgreSQL database. Vercel/Prisma Postgres is fine as long as it provides a standard `DATABASE_URL`.

4. Set environment variables in Vercel Project Settings:

   ```txt
   APP_BASE_URL=https://your-vercel-domain.vercel.app
   DATABASE_URL=your-production-postgres-url
   INFINI_BASE_HOST=openapi-sandbox.infini.money
   INFINI_KEY_ID=...
   INFINI_SECRET_KEY=...
   INFINI_WEBHOOK_SECRET=...
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=claude-haiku-4-5
   NEXT_PUBLIC_ENABLE_REVIEWER_TOOLS=true
   ```

   `ANTHROPIC_BASE_URL` is only needed when using an Anthropic-compatible proxy. Set `NEXT_PUBLIC_ENABLE_REVIEWER_TOOLS=true` so reviewers can reach the simulated payment path without a Web3 wallet.

   `APP_BASE_URL` must be the deployed URL, not `localhost`, and should not end with `/`.

5. Apply production migrations:

   ```bash
   npm run prisma:deploy
   ```

6. Configure the Infini webhook URL after deployment:

   ```txt
   https://your-vercel-domain.vercel.app/api/webhook
   ```

7. Create a checkout from the deployed app and verify that the Infini checkout URL contains the deployed `success_url`.

## Payment Flow

```txt
demo page
  -> /api/parse
  -> /api/products
  -> /api/orders
  -> Infini hosted checkout
  -> /success?orderId=localOrderId
  -> /api/orders/[id]/status
  -> paid receipt
```

The local order id is passed to Infini as `client_reference` and is included in the app's `success_url`. The success page never trusts the redirect alone; it calls the backend status route before showing the paid state.

## Reviewer Payment Path

Completing the Infini sandbox checkout requires a real Tron Testnet USDT transfer, which needs a Web3 wallet and testnet funds. To verify the post-payment screens without that, set `NEXT_PUBLIC_ENABLE_REVIEWER_TOOLS=true`. A "simulate payment" button then appears on the checkout-ready card and calls `POST /api/orders/[id]/simulate-paid`, which marks the existing order `paid` (with `rawStatus` `simulated_paid`) and redirects to the success page.

The route only responds when the flag is `true`, never calls Infini, and never changes the amount, product, or creates a new order. It exists only on builds where the flag is set; production builds leave it off. Because the variable is `NEXT_PUBLIC_`, it is read at build time — change it and redeploy for it to take effect.

## Currency Handling

Merchants price products in USD. Buyers choose a cryptocurrency on the Infini checkout page.

Accepted USD wording:

```txt
$, USD, dollars, bucks, 美元, 美金, 刀, 刀乐
```

Rejected CNY/RMB wording:

```txt
块, 块钱, 元, 人民币, ￥, ¥
```

Bare numbers without a currency are rejected. Prices must be positive, carry at most six decimal places, and stay at or below `100000`.

Claude handles natural-language extraction, but `lib/validate.ts` re-validates and normalizes the model output. The model is not trusted as the source of truth for payment amount or currency.

## Webhook

`/api/webhook` verifies the signature over:

```txt
{timestamp}.{event_id}.{payload}
```

The route deduplicates events by `event_id`, finds the local order by `client_reference` or Infini order id, and updates the order status.

Local signed webhook test:

```bash
node scripts/mock-webhook.mjs <localOrderId>
```

## Growth Tracking

The app records a lightweight funnel without an external analytics dependency.

```txt
landing_viewed
-> demo_started
-> parse_submitted
-> parse_succeeded / parse_failed
-> order_create_started
-> order_create_succeeded / order_create_failed
-> checkout_redirected
-> success_page_viewed
-> payment_paid_confirmed
```

- `anonymousId`: browser id stored in `localStorage`
- `sessionId`: 30-minute rolling session
- `eventId`: unique id for deduplication

Client events are sent with `navigator.sendBeacon` where possible, so redirecting to checkout does not easily lose the event.

## AI Extraction Eval

Run with the app running:

```bash
npm run eval
```

The eval cases cover happy paths, USD/CNY boundaries, crypto wording, prompt injection, missing price, missing product, and invalid amounts.

## Design Choices

- Amounts use `Decimal`, not floating point.
- Checkout creation uses an idempotent `requestId`.
- Paid orders are not downgraded by later stale status updates.
- Webhooks are signature-verified and deduplicated.
- AI output is revalidated before becoming payment data.
- Each checkout URL is one buyer payment attempt; selling the same product to multiple buyers creates multiple orders.
- The app uses the Infini sandbox.
- API routes are open in this build. Behind a real merchant account they would sit behind authentication and per-user rate limiting, and Infini calls would add request timeouts and retry with backoff.
