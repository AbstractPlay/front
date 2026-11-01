import { describe, expect, it } from "vitest";
import {
  PLAY_MOBILE_CHUNK_ORDER_DEFAULT,
  normalizePlayMobileOrder,
  playMobileOrderIncludesEssentials,
} from "./playMobileOrder";

describe("playMobileOrder", () => {
  it("default order includes all sections", () => {
    expect(PLAY_MOBILE_CHUNK_ORDER_DEFAULT).toEqual([
      "status",
      "move",
      "board",
      "moves",
      "chat",
    ]);
    expect(playMobileOrderIncludesEssentials(PLAY_MOBILE_CHUNK_ORDER_DEFAULT)).toBe(
      true
    );
  });

  it("normalizePlayMobileOrder restores missing chunks", () => {
    expect(normalizePlayMobileOrder(["board", "move"])).toEqual([
      "board",
      "move",
      "status",
      "moves",
      "chat",
    ]);
  });

  it("normalizePlayMobileOrder drops unknown keys and dedupes", () => {
    expect(
      normalizePlayMobileOrder(["move", "bogus", "move", "board"])
    ).toEqual(["move", "board", "status", "moves", "chat"]);
  });

  it("normalizePlayMobileOrder handles non-array storage", () => {
    expect(normalizePlayMobileOrder(null)).toEqual([
      ...PLAY_MOBILE_CHUNK_ORDER_DEFAULT,
    ]);
  });
});
