"use client";

import {
  BadgeDollarSign,
  BookOpen,
  ChevronDown,
  Code2,
  CreditCard,
  Globe2,
  Landmark,
  Newspaper,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { trackClientEvent } from "@/lib/tracking-client";

type MegaLink = {
  icon: LucideIcon;
  key:
    | "globalAccounts"
    | "corporateCards"
    | "paymentGateway"
    | "payroll"
    | "treasury"
    | "wallet"
    | "documentation"
    | "apiReference"
    | "blog"
    | "contactSales";
  href: string;
};

const PRODUCT_LINKS: MegaLink[] = [
  {
    icon: Globe2,
    key: "globalAccounts",
    href: "https://www.infini.money/",
  },
  {
    icon: CreditCard,
    key: "corporateCards",
    href: "https://www.infini.money/",
  },
  {
    icon: BadgeDollarSign,
    key: "paymentGateway",
    href: "https://www.infini.money/",
  },
  {
    icon: ReceiptText,
    key: "payroll",
    href: "https://www.infini.money/",
  },
  {
    icon: Landmark,
    key: "treasury",
    href: "https://www.infini.money/",
  },
  {
    icon: Wallet,
    key: "wallet",
    href: "https://www.infini.money/",
  },
];

const RESOURCE_LINKS: MegaLink[] = [
  {
    icon: BookOpen,
    key: "documentation",
    href: "https://developer.infini.money",
  },
  {
    icon: Code2,
    key: "apiReference",
    href: "https://developer.infini.money",
  },
  {
    icon: Newspaper,
    key: "blog",
    href: "https://www.infini.money/blog",
  },
  {
    icon: BadgeDollarSign,
    key: "contactSales",
    href: "https://www.infini.money/contact",
  },
];

const TYPEWRITER_SENTENCES = {
  en: [
    "Sell an AI market report for $10",
    "Create a checkout for a design audit at $299",
    "Charge $49 for my Notion growth template",
  ],
  zh: [
    "售卖一份 AI 市场报告，价格 $10",
    "为 $299 的设计审计创建收款链接",
    "为 Notion 增长模板收款 $49",
  ],
};

export default function HomePage() {
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    trackClientEvent("landing_viewed");

    const scribble = document.getElementById("scribble");
    const typewriter = document.getElementById("typewriter");
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let sentenceIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let active = true;
    let timeoutId: number | undefined;

    function updateScribble() {
      if (scribble) {
        scribble.style.transform = `translate(${mouseX}px, ${mouseY - scrollY}px)`;
      }
    }

    function handleMouseMove(event: MouseEvent) {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 20;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 20;
      updateScribble();
    }

    function handleScroll() {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      scrollY = winScroll * 0.2;
      updateScribble();
    }

    function typeLoop() {
      if (!typewriter || !active) {
        return;
      }
      const sentences = TYPEWRITER_SENTENCES[locale];
      const current = sentences[sentenceIndex];
      let typingSpeed = 100;

      if (isDeleting) {
        typewriter.innerHTML =
          current.substring(0, charIndex - 1) + '<span class="cursor-blink"></span>';
        charIndex -= 1;
        typingSpeed = 50;
      } else {
        typewriter.innerHTML =
          current.substring(0, charIndex + 1) + '<span class="cursor-blink"></span>';
        charIndex += 1;
      }

      if (!isDeleting && charIndex === current.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        sentenceIndex = (sentenceIndex + 1) % sentences.length;
        typingSpeed = 500;
      }

      timeoutId = window.setTimeout(typeLoop, typingSpeed);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    typeLoop();

    return () => {
      active = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [locale]);

  return (
    <div className="landing-page">
      <header className="infini-home-header">
        <Link href="/" className="infini-home-brand" aria-label="Infini AI home">
          <span className="infini-home-mark">
            <img src="/infini-logo.jpg" alt="" />
          </span>
          <span>INFINI</span>
        </Link>

        <nav className="infini-home-nav" aria-label="Primary">
          <div className="infini-nav-menu">
            <button className="infini-nav-trigger" type="button">
              {t.nav.products}
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            </button>
            <div className="infini-mega-panel" role="menu">
              <div className="infini-mega-grid">
                {PRODUCT_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      <Icon aria-hidden="true" size={28} strokeWidth={2.4} />
                      <span>{t.nav.productMenu[item.key as keyof typeof t.nav.productMenu]}</span>
                      <small>
                        {
                          t.nav.productMenuDescriptions[
                            item.key as keyof typeof t.nav.productMenuDescriptions
                          ]
                        }
                      </small>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="infini-nav-menu">
            <button className="infini-nav-trigger" type="button">
              {t.nav.resources}
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            </button>
            <div className="infini-mega-panel" role="menu">
              <div className="infini-mega-grid infini-mega-grid-compact">
                {RESOURCE_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      <Icon aria-hidden="true" size={28} strokeWidth={2.4} />
                      <span>{t.nav.resourceMenu[item.key as keyof typeof t.nav.resourceMenu]}</span>
                      <small>
                        {
                          t.nav.resourceMenuDescriptions[
                            item.key as keyof typeof t.nav.resourceMenuDescriptions
                          ]
                        }
                      </small>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <a href="https://developer.infini.money" target="_blank" rel="noreferrer">
            {t.nav.developers}
          </a>
          <a href="https://www.infini.money/pricing" target="_blank" rel="noreferrer">
            {t.nav.pricing}
          </a>
          <a href="https://www.infini.money/security" target="_blank" rel="noreferrer">
            {t.nav.security}
          </a>
          <a href="https://www.infini.money/about" target="_blank" rel="noreferrer">
            {t.nav.about}
          </a>
        </nav>

        <div className="infini-home-actions">
          <div className="infini-language-menu">
            <button className="infini-language-button" type="button" aria-label="Change language">
              <Globe2 aria-hidden="true" size={18} strokeWidth={2.3} />
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            </button>
            <div className="infini-language-dropdown" role="menu">
              <button
                className={locale === "en" ? "active" : undefined}
                type="button"
                onClick={() => setLocale("en")}
                role="menuitem"
              >
                English
              </button>
              <button
                className={locale === "zh" ? "active" : undefined}
                type="button"
                onClick={() => setLocale("zh")}
                role="menuitem"
              >
                中文
              </button>
            </div>
          </div>
          <Link
            href="/demo"
            className="infini-start-button"
            onClick={() => trackClientEvent("demo_started")}
          >
            {t.nav.getStarted}
          </Link>
        </div>
      </header>

      <svg
        id="fluid-bg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className="path-scribble"
          id="scribble"
          d="M -100,500 C 200,100 400,900 600,500 C 800,100 1100,600 1100,600 L 1100,1100 L -100,1100 Z"
        />
      </svg>

      <div className="vertical-label reveal" style={{ animationDelay: "0.2s" }}>
        AGENT
      </div>

      <main className="grid-container">
        <h1 className="headline reveal">
          <span className="headline-line headline-line-first">Infini</span>
          <span className="headline-line">AI Agent</span>
        </h1>

        <section className="hero-content">
          <div className="bilingual-tag reveal" style={{ animationDelay: "0.4s" }}>
            Payment Link / 支付链接
          </div>

          <p className="description reveal" style={{ animationDelay: "0.5s" }}>
            Generate complex crypto payment links with a single natural language sentence.
            <span className="description-zh">仅需一句话，即可生成复杂的加密货币支付链接。</span>
          </p>

          <div className="input-wrapper reveal" style={{ animationDelay: "0.6s" }}>
            <div className="typewriter" id="typewriter" />
          </div>

        </section>

        <aside className="steps-container">
          <div className="step reveal" style={{ animationDelay: "0.8s" }}>
            <div className="step-num">01</div>
            <div className="step-text">
              Speak your intent
              <span className="step-zh">描述支付意图</span>
            </div>
          </div>
          <div className="step reveal" style={{ animationDelay: "0.9s" }}>
            <div className="step-num">02</div>
            <div className="step-text">
              AI structures txn
              <span className="step-zh">AI 构建交易</span>
            </div>
          </div>
          <div className="step reveal" style={{ animationDelay: "1s" }}>
            <div className="step-num">03</div>
            <div className="step-text">
              Share secure link
              <span className="step-zh">分享安全链接</span>
            </div>
          </div>
        </aside>
      </main>

    </div>
  );
}
