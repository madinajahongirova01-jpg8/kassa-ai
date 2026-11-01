import type { NextRequest } from "next/server";
import { forwardDelete, forwardMutation } from "@/lib/api/route-helpers";

// The API links or unlinks the Telegram chat of the token's own user only.
export async function POST(request: NextRequest) {
  return forwardMutation(request, "/telegram/link", ["code"]);
}

export async function DELETE(request: NextRequest) {
  return forwardDelete(request, "/telegram/link");
}
