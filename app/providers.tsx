"use client";

import { useEffect, type ReactNode } from "react";
import { I18nProvider, type Locale } from "@/lib/i18n";

function BrowserEventRejectionGuard() {
  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (event.reason instanceof Event) {
        console.warn("Ignored browser event promise rejection.", {
          type: event.reason.type,
        });
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection, {
      capture: true,
    });
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, {
        capture: true,
      });
    };
  }, []);

  return null;
}

export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <BrowserEventRejectionGuard />
      {children}
    </I18nProvider>
  );
}
