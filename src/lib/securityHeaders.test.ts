import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./securityHeaders";

function headerMap(isDev: boolean) {
  return new Map(securityHeaders(isDev).map(({ key, value }) => [key, value]));
}

describe("security headers", () => {
  it("sets every required header", () => {
    const headers = headerMap(false);
    expect(headers.get("Strict-Transport-Security")).toMatch(/^max-age=\d+/);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toContain("microphone=(self)");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("keeps the policy same-origin and blocks framing", () => {
    const policy = contentSecurityPolicy(false);
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("worker-src 'self'");
    expect(policy).toContain("manifest-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toMatch(/https?:/);
  });

  it("allows eval only in development", () => {
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });
});
