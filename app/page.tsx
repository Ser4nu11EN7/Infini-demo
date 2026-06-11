"use client";

import {
  ChevronDown,
  Globe2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ComponentType, FocusEvent, SVGProps } from "react";
import { useI18n } from "@/lib/i18n";
import { trackClientEvent } from "@/lib/tracking-client";

type MegaMenu = "products" | "resources";

type MegaLink = {
  key:
    | "helpCenter"
    | "blog"
    | "contactUs";
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type ProductLink = {
  key:
    | "globalAccounts"
    | "corporateCards"
    | "paymentGateway"
    | "payroll"
    | "treasury"
    | "wallet";
  href: string;
  iconSrc: string;
};

const PRODUCT_LINKS: ProductLink[] = [
  {
    key: "globalAccounts",
    href: "https://www.infini.money/products/global-accounts",
    iconSrc: "/v4/navigator-icon/earth.svg",
  },
  {
    key: "corporateCards",
    href: "https://www.infini.money/products/corporate-cards",
    iconSrc: "/v4/navigator-icon/shape.svg",
  },
  {
    key: "paymentGateway",
    href: "https://www.infini.money/products/payments",
    iconSrc: "/v4/navigator-icon/financial-entries.svg",
  },
  {
    key: "payroll",
    href: "https://www.infini.money/products/payroll",
    iconSrc: "/v4/navigator-icon/financial-report.svg",
  },
  {
    key: "treasury",
    href: "https://www.infini.money/products/treasury",
    iconSrc: "/v4/navigator-icon/trending-top.svg",
  },
  {
    key: "wallet",
    href: "https://www.infini.money/infini-wallet",
    iconSrc: "/v4/navigator-icon/financial-entries.svg",
  },
];

const RESOURCE_LINKS: MegaLink[] = [
  {
    icon: HelpCenterIcon,
    key: "helpCenter",
    href: "https://help.infini.money/en/",
  },
  {
    icon: BlogIcon,
    key: "blog",
    href: "https://www.infini.money/blog",
  },
  {
    icon: ContactUsIcon,
    key: "contactUs",
    href: "https://calendly.com/zhujingfeng858/30min",
  },
];

function BlogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 25 24" fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.75 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-14Zm3 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm2 12.5h3v-5.5c0-.825.633-1.5 1.5-1.5a1.49 1.49 0 0 1 1.514 1.5V19h2.986v-6c0-2-1.5-3.5-3.5-3.5-1.5 0-2.5 1.084-2.5 1.084V10h-3v9Zm-5 0h3.014v-9H5.75v9Z"
      />
    </svg>
  );
}

function HelpCenterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-10.844 1H9.5l.5-2h4l-1.5 4H14l-.552 1.103a1.622 1.622 0 0 1-2.97-1.295L11.156 13ZM12 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
      />
    </svg>
  );
}

function ContactUsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 3C4.343 3 3 4.338 3 5.995V22l2.121-2.121A3 3 0 0 1 7.241 19h10.763A2.997 2.997 0 0 0 21 16V3H6Zm5 7c0 1.5-.5 3-2 4v-2a2 2 0 1 1 2-2Zm6 0c0 1.5-.5 3-2 4v-2a2 2 0 1 1 2-2Z"
      />
    </svg>
  );
}

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
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenu | null>(null);
  const closeMegaTimer = useRef<number | null>(null);

  function clearMegaCloseTimer() {
    if (closeMegaTimer.current !== null) {
      window.clearTimeout(closeMegaTimer.current);
      closeMegaTimer.current = null;
    }
  }

  function openMegaMenu(menu: MegaMenu) {
    clearMegaCloseTimer();
    setActiveMegaMenu(menu);
  }

  function scheduleMegaMenuClose() {
    clearMegaCloseTimer();
    closeMegaTimer.current = window.setTimeout(() => {
      setActiveMegaMenu(null);
      closeMegaTimer.current = null;
    }, 120);
  }

  function handleMegaMenuBlur(event: FocusEvent<HTMLDivElement>) {
    if (
      !(event.relatedTarget instanceof Node) ||
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      scheduleMegaMenuClose();
    }
  }

  useEffect(() => {
    return () => {
      clearMegaCloseTimer();
    };
  }, []);

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
          <div
            className={`infini-nav-menu${activeMegaMenu === "products" ? " is-open" : ""}`}
            onBlur={handleMegaMenuBlur}
            onFocus={() => openMegaMenu("products")}
            onMouseEnter={() => openMegaMenu("products")}
            onMouseLeave={scheduleMegaMenuClose}
          >
            <button className="infini-nav-trigger" type="button">
              {t.nav.products}
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            </button>
            <div
              className="infini-mega-panel"
              onMouseEnter={() => openMegaMenu("products")}
              role="menu"
            >
              <div className="infini-mega-grid">
                {PRODUCT_LINKS.map((item) => {
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      <img className="infini-mega-icon-image" src={item.iconSrc} alt="" />
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
          <div
            className={`infini-nav-menu${activeMegaMenu === "resources" ? " is-open" : ""}`}
            onBlur={handleMegaMenuBlur}
            onFocus={() => openMegaMenu("resources")}
            onMouseEnter={() => openMegaMenu("resources")}
            onMouseLeave={scheduleMegaMenuClose}
          >
            <button className="infini-nav-trigger" type="button">
              {t.nav.resources}
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            </button>
            <div
              className="infini-mega-panel infini-mega-panel-compact"
              onMouseEnter={() => openMegaMenu("resources")}
              role="menu"
            >
              <div className="infini-mega-grid infini-mega-grid-compact">
                {RESOURCE_LINKS.map((item) => {
                  const Icon = item.icon;
                  const href =
                    item.key === "helpCenter" && locale === "zh"
                      ? "https://help.infini.money/zh-CN/"
                      : item.href;
                  return (
                    <a
                      key={item.key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      <Icon aria-hidden="true" width={28} height={28} />
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
              <span className="infini-language-caret" aria-hidden="true" />
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
                简体中文（马来西亚）
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
