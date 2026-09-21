import { describe, expect, it } from "vitest";
import {
  gameListGlobalFilterFn,
  includesStringOnFields,
  normalizeFilterQuery,
  pairingGlobalFilterFn,
  recentGamesGlobalFilterFn,
} from "./tableGlobalFilter";

function row(original) {
  return { original };
}

describe("normalizeFilterQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeFilterQuery("  Foo ")).toBe("foo");
  });

  it("returns empty for blank input", () => {
    expect(normalizeFilterQuery("")).toBe("");
    expect(normalizeFilterQuery(null)).toBe("");
  });
});

describe("includesStringOnFields", () => {
  it("matches empty query for all rows", () => {
    expect(includesStringOnFields({ a: "x" }, [() => "hidden"], "")).toBe(true);
  });

  it("matches substring on scalar fields", () => {
    expect(
      includesStringOnFields({ name: "Alice Smith" }, [({ name }) => name], "smith")
    ).toBe(true);
  });

  it("matches player arrays by name", () => {
    expect(
      includesStringOnFields(
        {},
        [
          () => [
            { id: "1", name: "BotAlpha" },
            { id: "2", name: "Human" },
          ],
        ],
        "botalpha"
      )
    ).toBe(true);
  });
});

describe("gameListGlobalFilterFn", () => {
  it("finds rows by game id", () => {
    expect(
      gameListGlobalFilterFn(
        row({
          id: "abc-123",
          players: [],
          variants: [],
          winners: null,
          numMoves: 5,
        }),
        "global",
        "abc"
      )
    ).toBe(true);
  });

  it("finds rows by player name", () => {
    expect(
      gameListGlobalFilterFn(
        row({
          id: "g1",
          players: [{ id: "u1", name: "Zorro" }],
          variants: ["standard"],
          winners: null,
          numMoves: 1,
        }),
        "global",
        "zorro"
      )
    ).toBe(true);
  });
});

describe("recentGamesGlobalFilterFn", () => {
  it("finds rows by meta game display name", () => {
    expect(
      recentGamesGlobalFilterFn(
        row({
          id: "g1",
          metaGame: "loa",
          metaGameName: "Lines of Action",
          players: [],
          variants: [],
          winners: null,
          numMoves: 10,
        }),
        "global",
        "lines of"
      )
    ).toBe(true);
  });
});

describe("pairingGlobalFilterFn", () => {
  it("finds rows by player name on object columns", () => {
    expect(
      pairingGlobalFilterFn(
        row({
          round: 2,
          metagame: "Chess",
          p1: { id: "a", name: "Alice" },
          p2: { id: "b", name: "Bob" },
          variants: ["classic"],
          clock: "5/5/5",
        }),
        "global",
        "alice"
      )
    ).toBe(true);
  });

  it("finds rows by metagame label", () => {
    expect(
      pairingGlobalFilterFn(
        row({
          round: 1,
          metagame: "Arimaa",
          p1: { id: "a", name: "A" },
          p2: { id: "b", name: "B" },
          variants: [],
          clock: "0/0/0",
        }),
        "global",
        "arimaa"
      )
    ).toBe(true);
  });
});
