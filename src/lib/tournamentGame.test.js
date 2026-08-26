import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import { tournamentPlaySupported } from "./tournamentGame.js";

describe("tournamentPlaySupported", () => {
  it("is false for unknown games", () => {
    expect(tournamentPlaySupported("not-a-real-game-uid")).toBe(false);
  });

  it("is true when playercounts includes 2", () => {
    const withTwo = [...gameinfo.values()].find((g) =>
      g.playercounts.includes(2)
    );
    if (withTwo !== undefined) {
      expect(tournamentPlaySupported(withTwo.uid)).toBe(true);
    }
  });

  it("is false when playercounts is solo-only", () => {
    const soloOnly = [...gameinfo.values()].find(
      (g) => g.playercounts.length === 1 && g.playercounts[0] === 1
    );
    if (soloOnly !== undefined) {
      expect(tournamentPlaySupported(soloOnly.uid)).toBe(false);
    }
  });
});
