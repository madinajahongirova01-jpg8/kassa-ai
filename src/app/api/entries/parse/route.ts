import type { NextRequest } from "next/server";
import { forwardMutation } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return forwardMutation(request, "/entries/parse", ["text"]);
}
