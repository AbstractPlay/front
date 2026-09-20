import { describe, expect, it } from "vitest";
import {
  filterChallengeOpponents,
  filterOpponentOptionsByQuery,
  minSeenFromOnlySee,
  passesActivityFilter,
} from "./challengeOpponentOptions";

const NOW = 1_700_000_000_000;

const users = [
  { id: "me", name: "Me", lastSeen: NOW },
  { id: "a", name: "Alice", lastSeen: NOW },
  { id: "b", name: "Bob", lastSeen: NOW - 10 * 24 * 60 * 60 * 1000 },
  { id: "c", name: "Carol", lastSeen: NOW - 40 * 24 * 60 * 60 * 1000 },
];

describe("minSeenFromOnlySee", () => {
  it("returns 0 for all", () => {
    expect(minSeenFromOnlySee("all", NOW)).toBe(0);
  });

  it("returns week boundary", () => {
    expect(minSeenFromOnlySee("week", NOW)).toBe(NOW - 7 * 24 * 60 * 60 * 1000);
  });
});

describe("passesActivityFilter", () => {
  it("respects minSeen", () => {
    const minSeen = minSeenFromOnlySee("week", NOW);
    expect(passesActivityFilter(users[1], minSeen)).toBe(true);
    expect(passesActivityFilter(users[2], minSeen)).toBe(false);
  });
});

describe("filterChallengeOpponents", () => {
  it("excludes self and other slots", () => {
    const result = filterChallengeOpponents(users, {
      globalMeId: "me",
      slotIndex: 0,
      selectedOpponentIds: ["", { id: "b" }],
      onlySee: "all",
      now: NOW,
    });
    const ids = result.map((u) => u.id);
    expect(ids).not.toContain("me");
    expect(ids).not.toContain("b");
    expect(ids).toContain("a");
  });

  it("keeps current slot selection even when inactive", () => {
    const result = filterChallengeOpponents(users, {
      globalMeId: "me",
      slotIndex: 0,
      selectedOpponentIds: [{ id: "c" }],
      onlySee: "week",
      now: NOW,
    });
    expect(result.some((u) => u.id === "c")).toBe(true);
    expect(result.some((u) => u.id === "a")).toBe(true);
    expect(result.some((u) => u.id === "b")).toBe(false);
  });

  it("filters by activity for non-selected users", () => {
    const result = filterChallengeOpponents(users, {
      globalMeId: "me",
      slotIndex: 0,
      selectedOpponentIds: [""],
      onlySee: "week",
      now: NOW,
    });
    const ids = result.map((u) => u.id);
    expect(ids).toEqual(["a"]);
  });
});

describe("filterOpponentOptionsByQuery", () => {
  it("matches name and id", () => {
    const list = [
      { id: "xyz", name: "Zara" },
      { id: "abc", name: "Alpha" },
    ];
    expect(filterOpponentOptionsByQuery(list, "zar").map((u) => u.id)).toEqual([
      "xyz",
    ]);
    expect(filterOpponentOptionsByQuery(list, "abc").map((u) => u.id)).toEqual([
      "abc",
    ]);
  });
});
