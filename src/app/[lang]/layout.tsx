import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/app/fonts";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { PwaSetup } from "@/components/pwa/PwaSetup";
import { LOCALES } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { PWA_ICONS, PWA_NAME, PWA_THEME_COLOR } from "@/lib/pwa";
import "../globals.css";

// Every page is prerendered once per language; the proxy picks one by the language cookie.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    icons: { apple: PWA_ICONS.apple },
    appleWebApp: { capable: true, title: PWA_NAME, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
    >
      <body
        className="min-h-full bg-notebook font-body-md text-ink"
        suppressHydrationWarning
      >
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <PwaSetup />
      </body>
    </html>
  );
}
