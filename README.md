# Infini AI Agent Payment Demo / Infini AI 支付链接 Demo

Turn a merchant's natural-language request into a crypto checkout link.

将商家的自然语言收款描述转换成 Infini 托管的加密货币 checkout 支付链接。

Example / 示例：

```txt
I want to sell an AI report for $10
售卖一份 AI 市场报告，价格 $10
```

The app extracts the product and USD price with Claude, stores the product and order, creates an Infini checkout, and confirms payment status from the backend before showing the paid receipt.

应用会用 Claude 提取商品和 USD 定价，写入数据库，创建 Infini checkout，并在后端确认支付状态后展示支付凭证。

## Stack / 技术栈

- Next.js 15 App Router + React 19 + TypeScript
- Prisma ORM + PostgreSQL
- Anthropic Claude Haiku for extraction / Claude Haiku 做自然语言抽取
- Infini Hosted Checkout sandbox / Infini 托管收银台沙盒
- Local funnel tracking / 本地增长漏斗埋点

## Project Structure / 项目结构

```txt
app/
  page.tsx                       Landing page / 首页
  demo/page.tsx                  Create payment link / 创建支付链接
  orders/page.tsx                Order history / 订单与支付状态
  success/page.tsx               Payment status and receipt / 支付状态与凭证
  api/
    parse/route.ts               Claude extraction / AI 抽取
    products/route.ts            Product creation / 商品创建
    orders/route.ts              Order list and checkout creation / 订单列表与 checkout 创建
    orders/[id]/status/route.ts  Backend payment status refresh / 后端状态刷新
    webhook/route.ts             Infini webhook receiver / Infini webhook 接收
    events/route.ts              Client funnel events / 前端漏斗事件
lib/
  ai.ts                          Prompt, model call, failure mapping / Prompt、模型调用、失败归因
  infini.ts                      Infini signing and requests / Infini 签名和请求
  validate.ts                    Schemas, price and currency validation / Schema、金额和币种校验
  db.ts                          Prisma client singleton / Prisma 单例
  track.ts                       Server event writing / 服务端事件写入
  tracking-client.ts             Browser event sending / 浏览器事件发送
  i18n.tsx                       English and Chinese copy / 中英文文案
prisma/schema.prisma             Data model / 数据模型
eval/run.mjs, eval/cases.json    AI extraction eval / AI 抽取测试集
scripts/mock-webhook.mjs         Signed local webhook sender / 本地签名 webhook 模拟脚本
```

## Data Model / 数据模型

Defined in `prisma/schema.prisma`.

数据模型定义在 `prisma/schema.prisma`。

- **Product / 商品**: `name`, `price` as `Decimal(18,6)`, `currency`, `description`, `createdAt`.
- **Order / 订单**: local order id, Infini order id, idempotent `requestId`, checkout URL, amount, currency, status, timestamps.
- **ProcessedWebhookEvent / 已处理 webhook**: stores webhook event ids for idempotency.
- **Event / 埋点事件**: anonymous id, session id, event name, optional order/product id, JSON properties.

Order statuses / 订单状态：

```txt
creating, pending, processing, paid, partial_paid, expired, failed
```

Once an order is `paid`, later polling or webhook updates never move it backward.

订单一旦进入 `paid`，后续轮询或 webhook 不会把它回退到未支付状态。

## API Routes / API 路由

| Method | Path | Purpose / 用途 |
| --- | --- | --- |
| POST | `/api/parse` | Extract product and price with Claude / 用 Claude 提取商品和价格 |
| POST | `/api/products` | Create product / 创建商品 |
| POST | `/api/orders` | Create local order and Infini checkout / 创建本地订单和 Infini checkout |
| GET | `/api/orders` | List recent orders / 获取最近订单 |
| GET | `/api/orders/[id]/status` | Refresh payment status / 刷新支付状态 |
| POST | `/api/webhook` | Receive Infini webhook / 接收 Infini webhook |
| POST | `/api/events` | Record funnel events / 记录漏斗事件 |

## Run Locally / 本地运行

1. Install dependencies / 安装依赖：

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill the values.

   复制 `.env.example` 为 `.env`，并填入环境变量。

3. Create the local database schema / 创建本地数据库结构：

   ```bash
   npm run prisma:migrate
   ```

4. Start the app / 启动：

   ```bash
   npm run dev
   ```

Open / 打开：

```txt
http://localhost:3000
```

## Environment Variables / 环境变量

| Variable | Required | Description / 说明 |
| --- | --- | --- |
| `APP_BASE_URL` | Yes | Public app URL used to build Infini `success_url` and `failure_url`. Local: `http://localhost:3000`; production: deployed Vercel URL. / 应用公网地址，用于生成 Infini 回跳地址。本地是 `http://localhost:3000`，线上是 Vercel 域名。 |
| `DATABASE_URL` | Yes | PostgreSQL connection string. / PostgreSQL 连接串。 |
| `INFINI_BASE_HOST` | Yes | Infini API host. Sandbox default: `openapi-sandbox.infini.money`. / Infini API 域名，沙盒默认 `openapi-sandbox.infini.money`。 |
| `INFINI_KEY_ID` | Yes | Infini API key id. / Infini API key id。 |
| `INFINI_SECRET_KEY` | Yes | Infini request signing secret. / Infini 请求签名密钥。 |
| `INFINI_WEBHOOK_SECRET` | Yes | Secret for webhook signature verification. / webhook 验签密钥。 |
| `ANTHROPIC_API_KEY` | Yes | API key for Claude extraction. / Claude 抽取使用的 API key。 |
| `ANTHROPIC_MODEL` | No | Model name. Defaults to `claude-haiku-4-5`. / 模型名，默认 `claude-haiku-4-5`。 |
| `ANTHROPIC_BASE_URL` | No | Optional Anthropic-compatible endpoint override. / 可选的 Anthropic 兼容代理地址。 |

## Vercel Deployment / Vercel 部署

The repository is ready for Vercel.

仓库已经可以直接导入 Vercel。

1. Import the GitHub repository into Vercel.

   在 Vercel 导入 GitHub 仓库。

2. Keep the build command as:

   构建命令保持：

   ```bash
   npm run build
   ```

   `npm run build` runs:

   `npm run build` 实际会执行：

   ```bash
   prisma generate && next build
   ```

3. Create a PostgreSQL database. Vercel/Prisma Postgres is fine as long as it provides a standard `DATABASE_URL`.

   创建 PostgreSQL 数据库。使用 Vercel/Prisma Postgres 可以，只要最终提供标准 `DATABASE_URL`。

4. Set environment variables in Vercel Project Settings.

   在 Vercel Project Settings 中填环境变量。

   ```txt
   APP_BASE_URL=https://your-vercel-domain.vercel.app
   DATABASE_URL=your-production-postgres-url
   INFINI_BASE_HOST=openapi-sandbox.infini.money
   INFINI_KEY_ID=...
   INFINI_SECRET_KEY=...
   INFINI_WEBHOOK_SECRET=...
   ANTHROPIC_BASE_URL=https://api.ikuncode.cc
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=...
   ```

   `APP_BASE_URL` must be the deployed URL, not `localhost`, and should not end with `/`.

   `APP_BASE_URL` 必须是线上部署域名，不能是 `localhost`，末尾不要带 `/`。

5. Apply production migrations:

   对生产库执行迁移：

   ```bash
   npm run prisma:deploy
   ```

6. Configure the Infini webhook URL after deployment:

   部署后在 Infini 后台配置 webhook：

   ```txt
   https://your-vercel-domain.vercel.app/api/webhook
   ```

7. Create a checkout from the deployed app and verify that the Infini checkout URL contains the deployed `success_url`.

   从线上页面创建 checkout，并确认 Infini checkout URL 里的 `success_url` 是线上域名。

## Payment Flow / 支付流程

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

中文流程：

```txt
创建支付链接页面
  -> AI 抽取商品和 USD 金额
  -> 写入商品
  -> 创建本地订单和 Infini checkout
  -> 买家进入 Infini 托管收银台付款
  -> 回跳成功页
  -> 后端刷新可信支付状态
  -> 展示支付凭证
```

The local order id is passed to Infini as `client_reference` and is included in the app's `success_url`. The success page never trusts the redirect alone; it calls the backend status route before showing the paid state.

本地订单 id 会作为 `client_reference` 传给 Infini，并出现在应用的 `success_url` 中。成功页不会只因为浏览器回跳就显示已支付，而是会调用后端状态接口确认。

## Currency Handling / 币种处理

Merchants price products in USD. Buyers choose a cryptocurrency on the Infini checkout page.

商家用 USD 给商品定价，买家在 Infini checkout 页面选择加密货币支付。

Accepted USD wording / 支持的 USD 表达：

```txt
$, USD, dollars, bucks, 美元, 美金, 刀, 刀乐
```

Rejected CNY/RMB wording / 拒绝的人民币表达：

```txt
块, 块钱, 元, 人民币, ￥, ¥
```

Bare numbers without a currency are rejected. Prices must be positive, carry at most six decimal places, and stay at or below `100000`.

纯数字但没有币种会被拒绝。价格必须为正数，最多六位小数，且不超过 `100000`。

Claude handles natural-language extraction, but `lib/validate.ts` re-validates and normalizes the model output. The model is not trusted as the source of truth for payment amount or currency.

Claude 负责自然语言抽取，但 `lib/validate.ts` 会再次校验和归一化模型输出。支付金额和币种不会无条件信任模型。

## Webhook / Webhook

`/api/webhook` verifies the signature over:

`/api/webhook` 会对以下内容验签：

```txt
{timestamp}.{event_id}.{payload}
```

The route deduplicates events by `event_id`, finds the local order by `client_reference` or Infini order id, and updates the order status.

接口会用 `event_id` 去重，通过 `client_reference` 或 Infini order id 找到本地订单，并更新订单状态。

Local signed webhook test / 本地签名 webhook 测试：

```bash
node scripts/mock-webhook.mjs <localOrderId>
```

## Growth Tracking / 增长埋点

The app records a lightweight funnel without an external analytics dependency.

应用内置轻量漏斗埋点，不依赖外部分析服务。

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

- `anonymousId`: browser id stored in `localStorage` / 浏览器匿名 id
- `sessionId`: 30-minute rolling session / 30 分钟滚动 session
- `eventId`: unique id for deduplication / 用于去重的唯一事件 id

Client events are sent with `navigator.sendBeacon` where possible, so redirecting to checkout does not easily lose the event.

前端事件优先使用 `navigator.sendBeacon` 发送，跳转 checkout 时不容易丢事件。

## AI Extraction Eval / AI 抽取测试集

Run with the app running:

启动应用后运行：

```bash
npm run eval
```

The eval cases cover happy paths, USD/CNY boundaries, crypto wording, prompt injection, missing price, missing product, and invalid amounts.

测试集覆盖正常输入、美元/人民币边界、加密货币表述、提示词注入、缺少价格、缺少商品和非法金额。

## Production Notes / 生产环境说明

This is a take-home demo, but the implementation keeps several production payment concerns visible:

这是面试作业 demo，但实现中保留了几个生产支付系统会关注的点：

- Amounts use `Decimal`, not floating point. / 金额使用 `Decimal`，不使用浮点数。
- Checkout creation uses an idempotent `requestId`. / 创建 checkout 使用幂等 `requestId`。
- Paid orders are not downgraded by later stale status updates. / 已支付订单不会被后续旧状态回退。
- Webhooks are signature-verified and deduplicated. / webhook 会验签并去重。
- AI output is revalidated before becoming payment data. / AI 输出会在进入支付数据前再次校验。

Known demo tradeoffs:

demo 范围内的取舍：

- API routes are not authenticated. Production should add merchant auth, API keys or session middleware.
- There is no global rate limit. Production should protect `/api/parse` and `/api/orders`.
- Infini requests currently use simple failure handling. Production should add explicit timeouts and retry with backoff.

- API 路由没有鉴权。生产环境应增加商家鉴权、API key 或 session 中间件。
- 当前没有全局限流。生产环境应保护 `/api/parse` 和 `/api/orders`。
- Infini 请求目前是基础失败处理。生产环境应增加超时和指数退避重试。
