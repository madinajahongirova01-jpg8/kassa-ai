import type { Metadata } from "next";
import { Caveat, Fira_Code, Geologica, Inter } from "next/font/google";
import "./globals.css";

const geologica = Geologica({
  variable: "--font-geologica",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Kassa AI — дафтари рақамӣ",
  description:
    "Ҳисобдории содда ва дафтари насия барои тиҷорати хурд",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tg"
      className={`${geologica.variable} ${inter.variable} ${firaCode.variable} ${caveat.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-notebook font-body-md text-ink"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
