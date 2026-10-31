import type { NextRequest } from "next/server";
import { startSession } from "@/lib/api/route-helpers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return startSession(request, "/auth/register", ["email", "password", "businessName", "name"]);
}
