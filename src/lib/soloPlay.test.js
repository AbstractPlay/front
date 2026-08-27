import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import {
  formatElapsedMs,
  formatSoloOutcome,
  soloPlaySupported,
  soloVariantSummaryKey,
} from "./soloPlay";

describe("soloPlay", () => {
  it("detects solo-capable titles", () => {
    const soloOnly = [...gameinfo.values()].find(
      (info) => info.playercounts.length === 1 && info.playercounts[0] === 1
    );
    if (soloOnly !== undefined) {
      expect(soloPlaySupported(soloOnly.uid)).toBe(true);
    }
    expect(soloPlaySupported("not-a-real-game")).toBe(false);
  });

  it("formats elapsed time", () => {
    expect(formatElapsedMs(4500)).toBe("4.5s");
    expect(formatElapsedMs(65_000)).toBe("1:05");
  });

  it("formats graded solo outcomes from records", () => {
    const t = (key, opts) => {
      if (key === "solo.outcome.grade") {
        return `Grade: ${opts.grade}`;
      }
      if (key.startsWith("solo.grades.")) {
        return opts?.defaultValue ?? key;
      }
      return key;
    };
    const line = formatSoloOutcome({
      t,
      gameRec: {
        header: {
          "outcome-type": "graded",
          players: [{ grade: "excellent" }],
        },
      },
    });
    expect(line).toBe("Grade: excellent");
  });

  it("builds variant summary keys like summarize", () => {
    expect(soloVariantSummaryKey("puzzle", ["standard"])).toBe(
      "puzzle (standard)"
    );
    expect(soloVariantSummaryKey("puzzle", [])).toBe("puzzle (no variants)");
  });
});
