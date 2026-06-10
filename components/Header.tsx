"use client";

import Link from "next/link";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { t, toggleLocale } = useI18n();

  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Infini AI Payment Links home">
        <span className="brandMark" />
        Infini Agent Checkout
      </Link>
      <nav className="navLinks" aria-label="Primary navigation">
        <Link href="/">{t.nav.home}</Link>
        <Link href="/demo">{t.nav.demo}</Link>
        <Link href="/orders">{t.nav.orders}</Link>
        <button className="langToggle" type="button" onClick={toggleLocale}>
          <Languages size={16} />
          {t.nav.language}
        </button>
      </nav>
    </header>
  );
}
