import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infini AI Payment Links",
  description: "Create a crypto checkout link from a natural-language product request.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get("infini_demo_locale")?.value;
  const initialLocale = storedLocale === "zh" ? "zh" : "en";

  return (
    <html lang={initialLocale === "zh" ? "zh-CN" : "en"} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers initialLocale={initialLocale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
