import { describe, expect, it, vi } from "vitest";
import i18n from "../i18n";

vi.mock("@abstractplay/gameslib", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    GameFactory: () => ({
      winner: [1],
      formatEogSummary: () =>
        "The game has ended because both players passed.",
    }),
  };
});

import { formatGameOverStatus } from "./formatGameOverStatus";

describe("formatGameOverStatus", () => {
  it("includes apresults EOG detail in combined copy", () => {
    const { primary } = formatGameOverStatus({
      game: {
        numPlayers: 2,
        players: [
          { name: "Alice", id: "a" },
          { name: "Bob", id: "b" },
        ],
      },
      metaGame: "bridges",
      nodeState: "{}",
      allUsers: {},
      t: (key, params) => i18n.t(key, params),
      tApresults: (key, params) => i18n.t(key, params),
    });

    expect(primary).toContain("Alice");
    expect(primary).toContain("passed");
  });
});
