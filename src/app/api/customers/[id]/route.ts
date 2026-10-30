import type { NextRequest } from "next/server";
import { errorResponse, forwardMutation, isUuid } from "@/lib/api/route-helpers";

// Name and phone only; the API keeps omitted fields unchanged and clears the phone on null.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse({ status: 400, message: "Invalid customer id" });
  return forwardMutation(request, `/customers/${id}`, ["name", "phone"], "PATCH");
}
