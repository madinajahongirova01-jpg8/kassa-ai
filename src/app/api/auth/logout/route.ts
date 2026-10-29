import { NextResponse, type NextRequest } from "next/server";
import { rejectCrossOrigin } from "@/lib/api/route-helpers";
import { clearSessionCookie } from "@/lib/session";

// The API has no token revocation yet, so logging out removes the cookie only.
export async function POST(request: NextRequest) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  clearSessionCookie(response);
  return response;
}
