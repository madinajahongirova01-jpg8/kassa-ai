import { offlinePageHtml } from "@/lib/pwa";

export function GET() {
  return new Response(offlinePageHtml(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
