import { describe, expect, it } from "vitest";
import { resolveRequiredMetaGameParam } from "./metaGameRoute";

describe("resolveRequiredMetaGameParam", () => {
  it("rejects empty segment", () => {
    expect(resolveRequiredMetaGameParam("").kind).toBe("invalid");
    expect(resolveRequiredMetaGameParam(undefined).kind).toBe("invalid");
  });

  it("rejects unknown game slug", () => {
    expect(resolveRequiredMetaGameParam("not-a-real-game-uid").kind).toBe(
      "invalid"
    );
  });

  it("accepts catalog uid", () => {
    const result = resolveRequiredMetaGameParam("go");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.resolved).toBe("go");
    }
  });

  it("redirects when casing differs", () => {
    const result = resolveRequiredMetaGameParam("GO");
    if (resolveRequiredMetaGameParam("go").kind === "ok") {
      expect(result.kind).toBe("redirect");
      if (result.kind === "redirect") {
        expect(result.resolved).toBe("go");
      }
    }
  });
});
