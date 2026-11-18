import { describe, expect, it } from "vitest";
import { buildAccountResetPasswordPath } from "./accountPasswordReset";

describe("buildAccountResetPasswordPath", () => {
  it("includes username and pending flag", () => {
    const path = buildAccountResetPasswordPath("alice");
    expect(path).toBe("/account/reset-password?username=alice&pending=1");
  });

  it("adds a safe returnUrl when provided", () => {
    const path = buildAccountResetPasswordPath("alice", "/player/1?tab=games");
    expect(path).toBe(
      "/account/reset-password?username=alice&pending=1&returnUrl=%2Fplayer%2F1%3Ftab%3Dgames",
    );
  });

  it("drops unsafe returnUrl values", () => {
    const path = buildAccountResetPasswordPath("alice", "https://evil.test");
    expect(path).toBe("/account/reset-password?username=alice&pending=1&returnUrl=%2F");
  });
});