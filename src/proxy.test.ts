import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

const ORIGIN = "https://kassa.example";

function run(path: string, cookie?: string) {
  return proxy(new NextRequest(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} }));
}

describe("proxy", () => {
  it.each(["/admin", "/admin/", "/admin/users"])("sends %s to the home page", (path) => {
    const response = run(path, "kassa_session=token");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  it("does not treat a path that only starts with admin as the admin panel", () => {
    expect(run("/administrator").headers.get("location")).toBeNull();
  });

  it.each([
    ["/tg", "tg"],
    ["/ru", "ru"],
    ["/en/", "en"],
  ])("%s saves the language and opens the home page", (path, locale) => {
    const response = run(path);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    expect(response.headers.get("set-cookie")).toContain(`kassa_lang=${locale}`);
    expect(response.headers.get("set-cookie")).toContain("Path=/");
  });

  it("leaves other addresses that start with a language code alone", () => {
    expect(run("/russia").headers.get("location")).toBeNull();
    expect(run("/ru/pricing").headers.get("set-cookie")).toBeNull();
  });

  it("still sends /app without a session to the login page", () => {
    const response = run("/app/debts");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/login?next=%2Fapp%2Fdebts`);
  });
});
