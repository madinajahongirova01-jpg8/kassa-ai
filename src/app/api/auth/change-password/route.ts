import type { NextRequest } from "next/server";
import { changePasswordSession } from "@/lib/api/route-helpers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return changePasswordSession(request);
}
