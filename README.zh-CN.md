# Infini AI Agent 支付链接 Demo

[English](README.md) | **中文**

将商家的自然语言收款描述转换成 Infini 托管的加密货币 checkout 支付链接。

示例：

```txt
售卖一份 AI 市场报告，价格 $10
```

应用会用 Claude 提取商品和 USD 定价，写入商品和订单，创建 Infini checkout，并在后端确认支付状态后展示支付凭证。

## 技术栈

- Next.js 15 App Router + React 19 + TypeScript
- Prisma ORM + PostgreSQL
- Anthropic Claude Haiku 做自然语言抽取
- Infini 托管收银台沙盒
- 应用内轻量增长漏斗埋点

## 项目结构

```txt
app/
  page.tsx                       首页
  demo/page.tsx                  创建支付链接
  orders/page.tsx                订单与支付状态
  success/page.tsx               支付状态与凭证
  api/
    parse/route.ts               Claude 抽取
    products/route.ts            商品创建
    orders/route.ts              订单列表与 checkout 创建
    orders/[id]/status/route.ts  后端支付状态刷新
    webhook/route.ts             Infini webhook 接收
    events/route.ts              前端漏斗事件
lib/
  ai.ts                          Prompt、模型调用、失败归因
  infini.ts                      Infini 签名和请求
  validate.ts                    Schema、金额和币种校验
  db.ts                          Prisma 单例
  track.ts                       服务端事件写入
  tracking-client.ts             浏览器事件发送
  i18n.tsx                       中英文 UI 文案
prisma/schema.prisma             数据模型
eval/run.mjs, eval/cases.json    AI 抽取测试集
scripts/mock-webhook.mjs         本地签名 webhook 模拟脚本
```

## 数据模型

定义在 `prisma/schema.prisma`。

- **Product / 商品**：商品名、`Decimal(18,6)` 价格、币种、描述、创建时间。
- **Order / 订单**：本地订单 id、Infini 订单 id、幂等 `requestId`、checkout URL、金额、币种、状态、时间戳。
- **ProcessedWebhookEvent / 已处理 webhook**：保存 webhook event id，用于幂等去重。
- **Event / 埋点事件**：匿名 id、session id、事件名、可选订单/商品 id、JSON properties。

订单状态：

```txt
creating, pending, processing, paid, partial_paid, expired, failed
```

订单一旦进入 `paid`，后续轮询或 webhook 不会把它回退到未支付状态。

## API 路由

| Method | Path | 用途 |
| --- | --- | --- |
| POST | `/api/parse` | 用 Claude 提取商品和价格 |
| POST | `/api/products` | 创建商品 |
| POST | `/api/orders` | 创建本地订单和 Infini checkout |
| GET | `/api/orders` | 获取最近订单 |
| GET | `/api/orders/[id]/status` | 刷新支付状态 |
| POST | `/api/webhook` | 接收 Infini webhook |
| POST | `/api/events` | 记录漏斗事件 |

## 本地运行

1. 安装依赖：

   ```bash
   npm install
   ```

2. 复制 `.env.example` 为 `.env`，并填入环境变量。

3. 创建本地数据库结构：

   ```bash
   npm run prisma:migrate
   ```

4. 启动应用：

   ```bash
   npm run dev
   ```

打开：

```txt
http://localhost:3000
```

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `APP_BASE_URL` | 是 | 应用公网地址，用于生成 Infini `success_url` 和 `failure_url`。本地是 `http://localhost:3000`，线上是 Vercel 域名。 |
| `DATABASE_URL` | 是 | PostgreSQL 连接串。 |
| `INFINI_BASE_HOST` | 是 | Infini API 域名，沙盒默认 `openapi-sandbox.infini.money`。 |
| `INFINI_KEY_ID` | 是 | Infini API key id。 |
| `INFINI_SECRET_KEY` | 是 | Infini 请求签名密钥。 |
| `INFINI_WEBHOOK_SECRET` | 是 | webhook 验签密钥。 |
| `ANTHROPIC_API_KEY` | 是 | Claude 抽取使用的 API key。 |
| `ANTHROPIC_MODEL` | 否 | 模型名，默认 `claude-haiku-4-5`。 |
| `ANTHROPIC_BASE_URL` | 否 | 可选的 Anthropic 兼容代理地址。 |

## Vercel 部署

仓库已经可以直接导入 Vercel。

1. 在 Vercel 导入 GitHub 仓库。

2. 构建命令保持：

   ```bash
   npm run build
   ```

   `npm run build` 实际会执行：

   ```bash
   prisma generate && next build
   ```

3. 创建 PostgreSQL 数据库。使用 Vercel/Prisma Postgres 可以，只要最终提供标准 `DATABASE_URL`。

4. 在 Vercel Project Settings 中填环境变量：

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

   `APP_BASE_URL` 必须是线上部署域名，不能是 `localhost`，末尾不要带 `/`。

5. 对生产库执行迁移：

   ```bash
   npm run prisma:deploy
   ```

6. 部署后在 Infini 后台配置 webhook：

   ```txt
   https://your-vercel-domain.vercel.app/api/webhook
   ```

7. 从线上页面创建 checkout，并确认 Infini checkout URL 里的 `success_url` 是线上域名。

## 支付流程

```txt
创建支付链接页面
  -> /api/parse
  -> /api/products
  -> /api/orders
  -> Infini 托管收银台
  -> /success?orderId=localOrderId
  -> /api/orders/[id]/status
  -> 支付凭证
```

本地订单 id 会作为 `client_reference` 传给 Infini，并出现在应用的 `success_url` 中。成功页不会只因为浏览器回跳就显示已支付，而是会调用后端状态接口确认。

## 币种处理

商家用 USD 给商品定价，买家在 Infini checkout 页面选择加密货币支付。

支持的 USD 表达：

```txt
$, USD, dollars, bucks, 美元, 美金, 刀, 刀乐
```

拒绝的人民币表达：

```txt
块, 块钱, 元, 人民币, ￥, ¥
```

纯数字但没有币种会被拒绝。价格必须为正数，最多六位小数，且不超过 `100000`。

Claude 负责自然语言抽取，但 `lib/validate.ts` 会再次校验和归一化模型输出。支付金额和币种不会无条件信任模型。

## Webhook

`/api/webhook` 会对以下内容验签：

```txt
{timestamp}.{event_id}.{payload}
```

接口会用 `event_id` 去重，通过 `client_reference` 或 Infini order id 找到本地订单，并更新订单状态。

本地签名 webhook 测试：

```bash
node scripts/mock-webhook.mjs <localOrderId>
```

## 增长埋点

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

- `anonymousId`：浏览器匿名 id，存储在 `localStorage`
- `sessionId`：30 分钟滚动 session
- `eventId`：用于去重的唯一事件 id

前端事件优先使用 `navigator.sendBeacon` 发送，跳转 checkout 时不容易丢事件。

## AI 抽取测试集

启动应用后运行：

```bash
npm run eval
```

测试集覆盖正常输入、美元/人民币边界、加密货币表述、提示词注入、缺少价格、缺少商品和非法金额。

## 生产环境说明

这是面试作业 demo，但实现中保留了几个生产支付系统会关注的点：

- 金额使用 `Decimal`，不使用浮点数。
- 创建 checkout 使用幂等 `requestId`。
- 已支付订单不会被后续旧状态回退。
- webhook 会验签并去重。
- AI 输出会在进入支付数据前再次校验。

demo 范围内的取舍：

- API 路由没有鉴权。生产环境应增加商家鉴权、API key 或 session 中间件。
- 当前没有全局限流。生产环境应保护 `/api/parse` 和 `/api/orders`。
- Infini 请求目前是基础失败处理。生产环境应增加超时和指数退避重试。
