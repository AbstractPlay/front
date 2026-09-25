import { describe, it, expect } from "vitest";
import { isPersistedSortingState } from "./usePersistedTableSorting";

describe("isPersistedSortingState", () => {
  it("accepts a non-empty TanStack sorting array", () => {
    expect(
      isPersistedSortingState([{ id: "gameName", desc: false }])
    ).toBe(true);
    expect(
      isPersistedSortingState([
        { id: "timeRemaining", desc: true },
        { id: "gameName", desc: false },
      ])
    ).toBe(true);
  });

  it("rejects invalid shapes so corrupt storage falls back to defaults", () => {
    expect(isPersistedSortingState(null)).toBe(false);
    expect(isPersistedSortingState([])).toBe(false);
    expect(isPersistedSortingState([{ id: "", desc: false }])).toBe(false);
    expect(isPersistedSortingState([{ id: "x", desc: "yes" }])).toBe(false);
    expect(isPersistedSortingState({ id: "x", desc: false })).toBe(false);
  });
});
