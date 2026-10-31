import type { NextRequest } from "next/server";
import { errorResponse, forwardMutation, isUuid } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/payments/[id]/cancel">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse({ status: 400, message: "Invalid payment id" });
  return forwardMutation(request, `/payments/${id}/cancel`, []);
}
