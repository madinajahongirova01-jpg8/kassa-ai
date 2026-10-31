import type { NextRequest } from "next/server";
import { errorResponse, forwardMutation, isUuid } from "@/lib/api/route-helpers";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/debts/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse({ status: 400, message: "Invalid debt id" });
  return forwardMutation(request, `/debts/${id}`, ["amount", "description", "dueOn"], "PATCH");
}
