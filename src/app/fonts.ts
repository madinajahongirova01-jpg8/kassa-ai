import { Caveat, Fira_Code, Geologica, Inter } from "next/font/google";

// Shared by the root layout and global-error, which renders its own <html>.
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

export const fontVariables = `${geologica.variable} ${inter.variable} ${firaCode.variable} ${caveat.variable}`;
