import type { NextRequest } from "next/server";
import { errorResponse, forwardMutation, isUuid } from "@/lib/api/route-helpers";

// One payment split across the customer's open debts; the API does it atomically.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/customers/[id]/payments">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse({ status: 400, message: "Invalid customer id" });
  return forwardMutation(request, `/customers/${id}/payments`, ["amount", "method", "paidOn", "note"]);
}
