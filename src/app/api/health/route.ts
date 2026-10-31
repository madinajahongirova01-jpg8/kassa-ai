import { errorResponse, jsonResponse } from "@/lib/api/route-helpers";
import { apiRequest, SLOW_REQUEST_TIMEOUT_MS } from "@/lib/api/server";

export const maxDuration = 60;

export async function GET() {
  const result = await apiRequest<unknown>("/health", { timeoutMs: SLOW_REQUEST_TIMEOUT_MS });
  if (!result.ok) return errorResponse(result.error);
  return jsonResponse({ status: "ok" });
}
