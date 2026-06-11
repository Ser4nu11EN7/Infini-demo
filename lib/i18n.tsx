"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "zh";

const STORAGE_KEY = "infini_demo_locale";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const messages = {
  en: {
    nav: {
      home: "Home",
      demo: "Create Link",
      orders: "Orders",
      createPaymentLink: "Create Payment Link",
      ordersAndStatus: "Orders & Status",
      language: "中文",
      createNew: "Create New",
      products: "Products",
      resources: "Resources",
      developers: "Developers",
      pricing: "Pricing",
      security: "Security",
      about: "About Us",
      getStarted: "Get Started",
      terms: "Terms",
      support: "Support",
      status: "Status",
      productMenu: {
        globalAccounts: "Global Accounts",
        corporateCards: "Corporate Cards",
        paymentGateway: "Crypto Payment Gateway",
        payroll: "Crypto Payroll/Bill Pay",
        treasury: "Crypto Treasury",
        wallet: "Infini Wallet",
      },
      productMenuDescriptions: {
        globalAccounts: "Multi-currency accounts for global teams",
        corporateCards: "Control spend before it happens",
        paymentGateway: "Accept crypto at checkout",
        payroll: "Run payroll and vendor bills in crypto",
        treasury: "Put treasury balances to work",
        wallet: "Spend stablecoins and earn yield",
      },
      resourceMenu: {
        helpCenter: "Help Center",
        blog: "Blog",
        contactUs: "Contact us",
      },
      resourceMenuDescriptions: {
        helpCenter: "Guides, FAQs, and how-tos",
        blog: "News and product updates",
        contactUs: "Contact the Infini team",
      },
    },
    home: {
      eyebrow: "AI payment link generator",
      title: "Turn one selling sentence into a crypto checkout.",
      lead:
        "Describe what you want to sell. The agent extracts the product and price, creates the checkout, and verifies payment status before showing success.",
      cta: "Create payment link",
      orders: "View orders",
      input: "Input",
      inputValue: "AI report for $10",
      action: "Agent action",
      actionValue: "Create checkout",
      rail: "Payment rail",
      railValue: "Infini checkout",
      pending: "Pending checkout",
      step1Title: "Describe the sale",
      step1Body: "Use natural language instead of filling a product form.",
      step2Title: "Create checkout",
      step2Body:
        "The product is saved, the payment request is signed, and a hosted checkout URL is created.",
      step3Title: "Confirm payment",
      step3Body: "Payment status is verified before the success page shows paid status.",
    },
    demo: {
      eyebrow: "Create payment request",
      title: "Sell with one sentence",
      subtitle:
        "Describe your product and pricing. The AI agent extracts the details and generates a crypto payment link",
      label: "Natural-language request",
      placeholder: "I want to sell an AI report for $10",
      generate: "Extract product info",
      paymentDescription: "Payment Description",
      loadingParse: "Parsing...",
      parseFeedback: [
        "Understanding product and price...",
        "Checking amount and currency...",
        "Structuring checkout details...",
      ],
      extractedDetails: "Extracted Details",
      productName: "Product Name",
      paymentMethod: "Payment Method",
      provider: "Provider",
      cryptoCheckout: "Crypto Checkout",
      infiniSandbox: "Infini Checkout",
      creating: "Creating...",
      confirmCreate: "Confirm & Create",
      checkoutReady: "Checkout link ready",
      checkoutReadyBody:
        "Share this checkout link with the buyer, or open it to review the payment experience.",
      checkoutUrl: "Checkout URL",
      copyLink: "Copy link",
      copied: "Copied",
      createAnotherLink: "New buyer link",
      openCheckout: "Open checkout",
      simulatePaid: "Simulate paid",
      simulatingPaid: "Simulating...",
      review: "Review",
      product: "Product",
      amount: "Amount",
      confirm: "Confirm and open checkout",
      empty: "AI extraction results appear here before checkout creation.",
      parseError: "Please describe what you are selling and the USD price.",
      productError: "Could not create the product.",
      orderError: "Could not create the checkout.",
      simulatePaidError: "Could not simulate the paid webhook.",
      copyError: "Could not copy the checkout link.",
      errors: {
        PRICE_NOT_POSITIVE: "Price must be greater than zero.",
        PRICE_TOO_LOW: "Price must be at least 0.1 USD.",
        PRICE_TOO_HIGH: "Price must be 100000 USD or less.",
        PRICE_TOO_PRECISE: "Price can have at most 6 decimal places.",
        INPUT_TOO_LONG: "Keep the request under 500 characters.",
        MISSING_PRICE: "Please add a price.",
        MISSING_PRODUCT: "Please specify what you are selling.",
        MISSING_PRODUCT_AND_PRICE: "Please specify the product and price.",
        UNSUPPORTED_CURRENCY:
          "Price this product in USD. Buyers can choose a crypto payment method at checkout.",
        INVALID_INPUT: "Please describe the product and price briefly.",
        AI_EXTRACTION_FAILED: "Could not extract a valid product and price.",
        AI_PROVIDER_ERROR: "Product extraction is temporarily unavailable. Please try again.",
        VALIDATION_FAILED: "I could not extract a valid USD price. Please try again.",
      },
    },
    success: {
      paidEyebrow: "Payment confirmed",
      checkingEyebrow: "Checking payment",
      paidTitle: "Payment Successful",
      checkingTitle: "Checking payment status",
      paidBody: "Infini confirmed this payment.",
      checkingBody: "Checking payment status.",
      viewOrders: "View orders",
      createAnother: "Create another payment link",
      refreshStatus: "Refresh status",
      stillConfirming:
        "Still confirming. You can refresh the status or check the order later.",
      statusError: "Could not refresh payment status. The page will keep trying.",
      home: "Home",
      order: "Order",
      receipt: "Payment receipt",
      receiptSubtitle: "Infini hosted checkout",
      product: "Product",
      amount: "Amount",
      status: "Status",
      orderId: "Order ID",
      copy: "Copy",
      copied: "Copied",
      copyOrderId: "Copy order ID",
      fallbackProduct: "Product",
      waiting: "Waiting for order status...",
    },
    orders: {
      eyebrow: "Order history",
      title: "Payment attempts and status.",
      summary: "Order summary",
      summaryTotal: "Total orders",
      summaryPaid: "Paid",
      summaryInProgress: "In progress",
      summaryNeedsAttention: "Failed / expired",
      loading: "Loading orders...",
      empty: "No orders yet.",
      loadError: "Could not load orders. Please try again.",
      retry: "Retry",
      create: "Create a checkout",
      createNew: "Create New",
      createFirst: "Create First Order",
      emptyBody: "Once you create a checkout, it will appear here with payment status.",
      searchPlaceholder: "Search orders...",
      statusFilter: "Filter by status",
      allStatus: "All Status",
      product: "Product",
      amount: "Amount",
      status: "Status",
      created: "Created",
      action: "Action",
      checkout: "Checkout",
      open: "Open",
      openCheckout: "Open checkout",
      viewStatus: "View details",
      localId: "Local",
      infiniId: "Infini",
      unavailable: "Unavailable",
      pagination: "Order pages",
      previousPage: "Previous",
      nextPage: "Next",
      statuses: {
        paid: "Paid",
        pending: "Pending",
        processing: "Processing",
        creating: "Creating",
        failed: "Failed",
        expired: "Expired",
        partial_paid: "Partial",
      },
    },
  },
  zh: {
    nav: {
      home: "首页",
      demo: "创建链接",
      orders: "订单",
      createPaymentLink: "创建支付链接",
      ordersAndStatus: "订单与支付状态",
      language: "EN",
      createNew: "新建",
      products: "产品",
      resources: "资源",
      developers: "开发者",
      pricing: "定价",
      security: "安全",
      about: "关于我们",
      getStarted: "开始使用",
      terms: "条款",
      support: "支持",
      status: "状态",
      productMenu: {
        globalAccounts: "全球账户",
        corporateCards: "企业卡",
        paymentGateway: "加密支付网关",
        payroll: "加密薪酬与账单支付",
        treasury: "加密资金管理",
        wallet: "Infini 钱包",
      },
      productMenuDescriptions: {
        globalAccounts: "面向全球团队的多币种账户",
        corporateCards: "在支出发生前控制预算",
        paymentGateway: "在 checkout 接受加密货币支付",
        payroll: "用加密货币处理薪酬和供应商账单",
        treasury: "让资金余额运转起来",
        wallet: "使用稳定币消费并赚取收益",
      },
      resourceMenu: {
        helpCenter: "帮助中心",
        blog: "博客",
        contactUs: "联系我们",
      },
      resourceMenuDescriptions: {
        helpCenter: "指南、常见问题和教程",
        blog: "新闻和产品更新",
        contactUs: "联系 Infini 团队",
      },
    },
    home: {
      eyebrow: "AI Agent 支付演示",
      title: "一句话，把商品变成加密支付链接。",
      lead:
        "描述你想卖什么。系统会提取商品和价格，创建收银台，并在展示成功前确认支付状态。",
      cta: "创建支付链接",
      orders: "查看订单",
      input: "输入",
      inputValue: "AI 报告，10 美元",
      action: "Agent 动作",
      actionValue: "创建收银台",
      rail: "支付通道",
      railValue: "Infini 收银台",
      pending: "待支付",
      step1Title: "描述商品",
      step1Body: "用自然语言表达售卖意图，不必手填商品表单。",
      step2Title: "创建收银台",
      step2Body: "后端存储商品、签名 Infini 请求，并返回托管 checkout URL。",
      step3Title: "确认支付",
      step3Body: "系统会先确认支付状态，再展示支付成功。",
    },
    demo: {
      eyebrow: "创建支付请求",
      title: "用一句话开始收款",
      subtitle: "描述商品和价格，AI Agent 会提取关键信息并生成加密货币支付链接",
      label: "自然语言请求",
      placeholder: "I want to sell an AI report for $10",
      generate: "提取商品信息",
      paymentDescription: "支付描述",
      loadingParse: "解析中...",
      parseFeedback: [
        "正在理解商品和价格...",
        "正在校验金额和币种...",
        "正在整理 checkout 信息...",
      ],
      extractedDetails: "提取详情",
      productName: "商品名",
      paymentMethod: "支付方式",
      provider: "服务商",
      cryptoCheckout: "加密货币收银台",
      infiniSandbox: "Infini 收银台",
      creating: "创建中...",
      confirmCreate: "确认并创建",
      checkoutReady: "Checkout 链接已生成",
      checkoutReadyBody:
        "将这个收银台链接发送给买家，也可以打开预览付款流程。",
      checkoutUrl: "Checkout URL",
      copyLink: "复制链接",
      copied: "已复制",
      createAnotherLink: "新买家链接",
      openCheckout: "打开 checkout",
      simulatePaid: "模拟完成支付",
      simulatingPaid: "模拟中...",
      review: "确认信息",
      product: "商品",
      amount: "金额",
      confirm: "确认并打开收银台",
      empty: "AI 提取结果会在创建 checkout 前显示在这里。",
      parseError: "请说明你要卖什么，以及对应的美元价格。",
      productError: "商品创建失败。",
      orderError: "收银台创建失败。",
      simulatePaidError: "模拟支付完成失败。",
      copyError: "复制 checkout 链接失败。",
      errors: {
        PRICE_NOT_POSITIVE: "金额必须大于 0。",
        PRICE_TOO_LOW: "金额至少为 0.1 美元。",
        PRICE_TOO_HIGH: "金额不能超过 100000 美元。",
        PRICE_TOO_PRECISE: "金额最多支持 6 位小数。",
        INPUT_TOO_LONG: "请求内容不能超过 500 个字符。",
        MISSING_PRICE: "请补充价格。",
        MISSING_PRODUCT: "请说明你要卖什么。",
        MISSING_PRODUCT_AND_PRICE: "请说明商品和价格。",
        UNSUPPORTED_CURRENCY:
          "请用 USD 美元为商品定价。买家可以在收银台选择加密货币支付。",
        INVALID_INPUT: "请简短描述商品和价格。",
        AI_EXTRACTION_FAILED: "无法提取有效的商品和价格。",
        AI_PROVIDER_ERROR: "商品信息提取暂时不可用，请稍后重试。",
        VALIDATION_FAILED: "无法提取有效的美元价格，请重试。",
      },
    },
    success: {
      paidEyebrow: "支付已确认",
      checkingEyebrow: "正在确认支付",
      paidTitle: "支付成功",
      checkingTitle: "正在确认支付状态",
      paidBody: "Infini 已确认这笔支付。",
      checkingBody: "正在确认支付状态。",
      viewOrders: "查看订单",
      createAnother: "继续创建支付链接",
      refreshStatus: "刷新状态",
      stillConfirming: "仍在确认中。你可以手动刷新状态，或稍后到订单页查看。",
      statusError: "支付状态刷新失败。页面会继续重试。",
      home: "返回首页",
      order: "订单",
      receipt: "支付凭证",
      receiptSubtitle: "Infini 托管收银台",
      product: "商品",
      amount: "金额",
      status: "状态",
      orderId: "订单 ID",
      copy: "复制",
      copied: "已复制",
      copyOrderId: "复制订单 ID",
      fallbackProduct: "商品",
      waiting: "正在等待订单状态...",
    },
    orders: {
      eyebrow: "历史订单",
      title: "支付尝试与状态。",
      summary: "订单汇总",
      summaryTotal: "全部订单",
      summaryPaid: "已支付",
      summaryInProgress: "处理中",
      summaryNeedsAttention: "失败/过期",
      loading: "正在加载订单...",
      empty: "还没有订单。",
      loadError: "订单加载失败，请重试。",
      retry: "重试",
      create: "创建 checkout",
      createNew: "新建",
      createFirst: "创建首单",
      emptyBody: "创建 checkout 后，它会带着支付状态出现在这里。",
      searchPlaceholder: "搜索订单...",
      statusFilter: "按状态筛选",
      allStatus: "所有状态",
      product: "商品",
      amount: "金额",
      status: "状态",
      created: "创建时间",
      action: "操作",
      checkout: "收银台",
      open: "打开",
      openCheckout: "打开 checkout",
      viewStatus: "查看详情",
      localId: "本地",
      infiniId: "Infini",
      unavailable: "不可用",
      pagination: "订单分页",
      previousPage: "上一页",
      nextPage: "下一页",
      statuses: {
        paid: "已支付",
        pending: "待处理",
        processing: "处理中",
        creating: "创建中",
        failed: "失败",
        expired: "已过期",
        partial_paid: "部分支付",
      },
    },
  },
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (typeof messages)[Locale];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if ((stored === "en" || stored === "zh") && stored !== initialLocale) {
      setLocaleState(stored);
    }
  }, [initialLocale]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }, [hasHydrated, locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((current) => (current === "en" ? "zh" : "en")),
      t: messages[locale],
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
