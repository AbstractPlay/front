import { describe, expect, it, vi } from "vitest";
import { formatChallengeTablePlayerCount } from "./challengeTablePlayerCount";

describe("formatChallengeTablePlayerCount", () => {
  const t = vi.fn((key, opts) => {
    if (key === "StandingChallengeOpenSeats") {
      return `${opts.total} (${opts.open} open)`;
    }
    return key;
  });

  it("shows open suffix only when numPlayers > 2", () => {
    expect(formatChallengeTablePlayerCount(2, 1, t)).toBe("2");
    expect(t).not.toHaveBeenCalled();
    expect(formatChallengeTablePlayerCount(3, 1, t)).toBe("3 (1 open)");
    expect(formatChallengeTablePlayerCount(4, 2, t)).toBe("4 (2 open)");
  });

  it("shows plain count when no open slots", () => {
    expect(formatChallengeTablePlayerCount(3, 0, t)).toBe("3");
  });
});
