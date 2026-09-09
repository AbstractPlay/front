import { describe, expect, it } from "vitest";
import { validateAvatarSeed } from "./validateSeed";

describe("validateAvatarSeed", () => {
  it("accepts trimmed alphanumeric seeds", () => {
    expect(validateAvatarSeed("  user_123-abc  ")).toEqual({
      ok: true,
      seed: "user_123-abc",
    });
  });

  it("rejects empty seeds", () => {
    expect(validateAvatarSeed("   ").ok).toBe(false);
  });

  it("rejects invalid characters", () => {
    expect(validateAvatarSeed("hello world").ok).toBe(false);
    expect(validateAvatarSeed("emoji😀").ok).toBe(false);
  });

  it("rejects overly long seeds", () => {
    expect(validateAvatarSeed("a".repeat(65)).ok).toBe(false);
  });
});
