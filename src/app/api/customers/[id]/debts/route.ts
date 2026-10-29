import type { NextRequest } from "next/server";
import { errorResponse, forwardMutation, isUuid } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/customers/[id]/debts">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse({ status: 400, message: "Invalid customer id" });
  return forwardMutation(request, `/customers/${id}/debts`, ["amount", "description", "occurredOn", "dueOn"]);
}
