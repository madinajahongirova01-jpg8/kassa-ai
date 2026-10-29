import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest, nearestForwardedIp } from "@/lib/api/server";
import type { ApiPage } from "@/lib/api/types";
import { SESSION_COOKIE } from "@/lib/session";

// Data Access Layer for Server Components: the session token is read from the httpOnly cookie here
// and sent to the API as a Bearer header. It never reaches browser JavaScript, and the API scopes
// every query to the token's user.

const PAGE_SIZE = 200;
// Safety net against a runaway loop; 50 pages of 200 rows is far more than one shop records in a month.
const MAX_PAGES = 50;

export class ApiLoadError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiLoadError";
  }
}

/** GET from the API as the signed-in user. A missing or rejected session goes to the login page. */
export async function sessionGet<T>(path: string, returnTo: string): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const login = `/login?next=${encodeURIComponent(returnTo)}`;
  if (!token) redirect(login);

  const clientIp = nearestForwardedIp((await headers()).get("x-forwarded-for"));
  const result = await apiRequest<T>(path, { token, clientIp });
  if (!result.ok) {
    if (result.error.status === 401) redirect(login);
    throw new ApiLoadError(result.error.status, result.error.message);
  }
  return result.data;
}

/** Reads every page of a cursor-paginated list. */
export async function sessionGetAll<T>(path: string, query: Record<string, string>, returnTo: string): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ ...query, limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    const result: ApiPage<T> = await sessionGet<ApiPage<T>>(`${path}?${params}`, returnTo);
    items.push(...result.items);
    cursor = result.nextCursor;
    if (cursor === null) return items;
  }
  throw new ApiLoadError(500, "Too many rows to load at once");
}
