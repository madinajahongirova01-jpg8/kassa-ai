import { describe, expect, it } from "vitest";
import { readAuthResult } from "./route-helpers";

const USER = { id: "u1", email: "owner@example.com", name: null, businessName: "Shop" };

describe("readAuthResult", () => {
  it("accepts a complete auth response", () => {
    expect(readAuthResult({ accessToken: "t", tokenType: "Bearer", expiresIn: 3600, user: USER })).toEqual({
      accessToken: "t",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: USER,
    });
  });

  it.each([
    ["no body", null],
    ["no token", { expiresIn: 3600, user: USER }],
    ["a broken expiry", { accessToken: "t", expiresIn: 0, user: USER }],
    ["no user", { accessToken: "t", expiresIn: 3600 }],
  ])("rejects %s", (_case, data) => {
    expect(readAuthResult(data)).toBeNull();
  });
});
