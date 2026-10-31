import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import {
  formatCompletedGameEnd,
  formatEogReasonLabel,
} from "./formatCompletedGameEnd";

const t = (key, params) => i18n.t(key, { ...params, ns: "apfront" });
const tApresults = (key, params) => i18n.t(key, { ...params, ns: "apresults" });

describe("formatEogReasonLabel", () => {
  it("resolves game-specific EOG keys", () => {
    const label = formatEogReasonLabel({
      metaGame: "squares",
      eogReason: "stalemate",
      tApresults,
    });
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe("squares.EOG.stalemate");
  });

  it("falls back to _general EOG keys", () => {
    const label = formatEogReasonLabel({
      metaGame: "hex",
      eogReason: "stalemate",
      tApresults,
    });
    expect(label).toContain("run out of moves");
  });
});

describe("formatCompletedGameEnd", () => {
  it("labels timeout with player", () => {
    const text = formatCompletedGameEnd({
      metaGame: "hex",
      gameEndKind: "timeout",
      gameEndPlayer: 2,
      players: [
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob" },
      ],
      allUsers: [],
      t,
      tApresults,
    });
    expect(text).toContain("Bob");
    expect(text.toLowerCase()).toContain("time");
  });

  it("returns empty for normal end without eogReason", () => {
    expect(
      formatCompletedGameEnd({
        metaGame: "hex",
        gameEndKind: "normal",
        players: [],
        allUsers: [],
        t,
        tApresults,
      })
    ).toBe("");
  });
});
