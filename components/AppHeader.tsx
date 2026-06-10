"use client";

import { Globe2, Plus } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type AppHeaderProps = {
  active: "demo" | "orders";
  showCreate?: boolean;
};

export function AppHeader({ active, showCreate = false }: AppHeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <nav className="variant-nav variant-nav-wide app-header">
      <div className="nav-left">
        <Link href="/" className="infini-home-brand" aria-label="Infini AI home">
          <span className="infini-home-mark">
            <img src="/infini-logo.jpg" alt="" />
          </span>
          <span>INFINI</span>
        </Link>
        <div className="infini-home-nav app-header-nav">
          <Link
            href="/demo"
            className={
              active === "demo"
                ? "app-header-nav-link app-header-nav-link-active"
                : "app-header-nav-link"
            }
          >
            {t.nav.createPaymentLink}
          </Link>
          <Link
            href="/orders"
            className={
              active === "orders"
                ? "app-header-nav-link app-header-nav-link-active"
                : "app-header-nav-link"
            }
          >
            {t.nav.ordersAndStatus}
          </Link>
        </div>
      </div>
      <div className="nav-right">
        <div className="infini-language-menu app-language-menu">
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
        {showCreate ? (
          <Link href="/demo" className="emerald-button">
            <Plus size={16} />
            {t.nav.createNew}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
