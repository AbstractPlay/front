import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";

const mockEngine = {
  winner: [1],
  formatEogSummary: () =>
    "The game has ended because both players passed.",
};

vi.mock("@abstractplay/gameslib", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    GameFactory: () => mockEngine,
  };
});

import { formatGameOverStatus } from "./formatGameOverStatus";

describe("formatGameOverStatus", () => {
  beforeEach(() => {
    mockEngine.winner = [1];
    mockEngine.formatEogSummary = () =>
      "The game has ended because both players passed.";
  });

  it("omits generic apresults EOG default when a winner is shown", () => {
    mockEngine.formatEogSummary = () => "The game has ended.";

    const { primary } = formatGameOverStatus({
      game: {
        numPlayers: 2,
        players: [
          { name: "mcd", id: "m" },
          { name: "Other", id: "o" },
        ],
      },
      metaGame: "acity",
      nodeState: "{}",
      allUsers: {},
      t: (key, params) => i18n.t(key, params),
      tApresults: (key, params) => i18n.t(key, params),
    });

    expect(primary).toBe(i18n.t("GameIsOver1", { winner: "mcd" }));
    expect(primary.match(/The game has ended/g)?.length).toBe(1);
  });

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
