import { describe, expect, it } from "vitest";
import { getJwtExpiryMs, isJwtExpired } from "./authSession";

function makeToken(exp) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode({ exp })}.sig`;
}

describe("getJwtExpiryMs", () => {
  it("returns null for invalid tokens", () => {
    expect(getJwtExpiryMs(null)).toBeNull();
    expect(getJwtExpiryMs("not-a-jwt")).toBeNull();
    expect(getJwtExpiryMs("a.b")).toBeNull();
  });

  it("decodes exp from a JWT payload", () => {
    const exp = 1_700_000_000;
    expect(getJwtExpiryMs(makeToken(exp))).toBe(exp * 1000);
  });
});

describe("isJwtExpired", () => {
  it("is true when exp is in the past", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    expect(isJwtExpired(makeToken(exp))).toBe(true);
  });

  it("is false when exp is well beyond the buffer", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    expect(isJwtExpired(makeToken(exp))).toBe(false);
  });

  it("is true when exp is inside the default buffer window", () => {
    const exp = Math.floor(Date.now() / 1000) + 120;
    expect(isJwtExpired(makeToken(exp), { bufferSec: 300 })).toBe(true);
  });
});
