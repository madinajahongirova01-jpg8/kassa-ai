import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { PWA_BACKGROUND_COLOR, PWA_ICONS, PWA_NAME, PWA_START_URL, PWA_THEME_COLOR } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA_START_URL,
    name: PWA_NAME,
    short_name: PWA_NAME,
    description: createT(DEFAULT_LOCALE)("meta.description"),
    start_url: PWA_START_URL,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    icons: [
      { src: PWA_ICONS.small, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: PWA_ICONS.large, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: PWA_ICONS.maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
