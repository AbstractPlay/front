import { describe, expect, it, vi } from "vitest";
import {
  applyEffectiveFlags,
  blocksExplorationAutomoveForPieEven,
  challengeNoExploreActive,
  effectiveFlags,
  effectiveFlagsForChallenge,
  flagSetIncludes,
  sessionExplorationAllowed,
} from "./effectiveGameFlags";

vi.mock("@abstractplay/gameslib", () => ({
  gameinfo: {
    get: vi.fn((uid) => {
      if (uid === "static-pie") {
        return { flags: ["pie", "pie-even", "check"] };
      }
      if (uid === "basalt") {
        return { flags: ["check"] };
      }
      return { flags: ["simultaneous", "check"] };
    }),
  },
  resolveGameFlags: vi.fn((uid, context) => {
    if (uid === "basalt" && context.variants?.includes("pie")) {
      return ["check", "pie-even"];
    }
    if (uid === "yavalath" && context.numplayers === 2) {
      return ["pie"];
    }
    return [];
  }),
}));

describe("effectiveGameFlags", () => {
  it("flagSetIncludes checks array membership", () => {
    expect(flagSetIncludes(["pie", "check"], "pie")).toBe(true);
    expect(flagSetIncludes(["check"], "pie")).toBe(false);
    expect(flagSetIncludes(null, "pie")).toBe(false);
  });

  it("effectiveFlags prefers engine.getFlags()", () => {
    const engine = { getFlags: () => ["pie-even"] };
    expect(effectiveFlags(engine, "static-pie")).toEqual(["pie-even"]);
  });

  it("effectiveFlags falls back to gameinfo when engine lacks getFlags", () => {
    expect(effectiveFlags(null, "static-pie")).toEqual([
      "pie",
      "pie-even",
      "check",
    ]);
    expect(effectiveFlags({}, "static-pie")).toEqual([
      "pie",
      "pie-even",
      "check",
    ]);
  });

  it("effectiveFlagsForChallenge uses resolveGameFlags", () => {
    expect(
      effectiveFlagsForChallenge("basalt", {
        variants: ["pie"],
        numplayers: 2,
      })
    ).toEqual(["check", "pie-even"]);
    expect(
      effectiveFlagsForChallenge("yavalath", { variants: [], numplayers: 2 })
    ).toEqual(["pie"]);
  });

  it("applyEffectiveFlags uses engine flags over static gameinfo for pie", () => {
    const game0 = {};
    const engine = { getFlags: () => [] };
    applyEffectiveFlags(game0, engine, "static-pie");
    expect(game0.pie).toBe(false);
    expect(game0.pieEven).toBe(false);
    expect(game0.canCheck).toBe(false);
  });

  it("applyEffectiveFlags sets pie from getFlags override", () => {
    const game0 = {};
    const engine = { getFlags: () => ["pie-even", "automove"] };
    applyEffectiveFlags(game0, engine, "basalt");
    expect(game0.pie).toBe(true);
    expect(game0.pieEven).toBe(true);
    expect(game0.automove).toBe(true);
    expect(game0.simultaneous).toBe(false);
  });

  it("applyEffectiveFlags keeps simultaneous from static gameinfo", () => {
    const game0 = {};
    applyEffectiveFlags(game0, { getFlags: () => [] }, "entropy");
    expect(game0.simultaneous).toBe(true);
  });

  it("challengeNoExploreActive is in-game only", () => {
    expect(
      challengeNoExploreActive({ noExplore: true, gameOver: false })
    ).toBe(true);
    expect(
      challengeNoExploreActive({ noExplore: true, gameOver: true })
    ).toBe(false);
    expect(challengeNoExploreActive({ noExplore: false, gameOver: false })).toBe(
      false
    );
  });

  it("sessionExplorationAllowed respects agreement, flag, and shape", () => {
    const twoPlayer = { numPlayers: 2, simultaneous: false };
    expect(
      sessionExplorationAllowed({
        ...twoPlayer,
        noExplore: true,
        gameOver: false,
      })
    ).toBe(false);
    expect(
      sessionExplorationAllowed({
        ...twoPlayer,
        noExplore: true,
        gameOver: true,
      })
    ).toBe(true);
    expect(
      sessionExplorationAllowed({
        ...twoPlayer,
        noExploreFlag: true,
        gameOver: true,
      })
    ).toBe(false);
    expect(
      sessionExplorationAllowed({ numPlayers: 3, simultaneous: false })
    ).toBe(false);
    expect(
      sessionExplorationAllowed({ numPlayers: 2, simultaneous: true })
    ).toBe(false);
    expect(sessionExplorationAllowed(null)).toBe(false);
  });

  it("blocksExplorationAutomoveForPieEven at stack depth 2", () => {
    const game = { pieEven: true };
    const engine = { state: () => ({ stack: [{}, {}] }) };
    expect(blocksExplorationAutomoveForPieEven(game, engine)).toBe(true);
    expect(
      blocksExplorationAutomoveForPieEven(
        { pieEven: true },
        { state: () => ({ stack: [{}, {}, {}] }) }
      )
    ).toBe(false);
    expect(blocksExplorationAutomoveForPieEven({ pieEven: false }, engine)).toBe(
      false
    );
  });
});
