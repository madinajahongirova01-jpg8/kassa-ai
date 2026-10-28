import type { Metadata } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "cyrillic-ext"],
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
      className={`${inter.variable} ${jakarta.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-full bg-surface font-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}
