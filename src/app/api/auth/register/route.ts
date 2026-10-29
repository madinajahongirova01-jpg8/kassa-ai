import type { NextRequest } from "next/server";
import { startSession } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return startSession(request, "/auth/register", ["email", "password", "name"]);
}
