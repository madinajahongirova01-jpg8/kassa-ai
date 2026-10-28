import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Kassa AI — дафтари рақамӣ",
  description:
    "Ҳисобдории овозӣ ва дафтари насия барои тиҷорати хурди Тоҷикистон",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tg"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-surface font-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}
