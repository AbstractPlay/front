import { describe, expect, it } from "vitest";
import { lookupDirectoryName, resolveDisplayName } from "./resolveDisplayName";
import { BOT_DISPLAY_PREFIX } from "../components/Bots/botUtils";

const users = [
  { id: "u1", name: "Alice Current" },
  { id: "bot1", name: "Test Bot", bot: true },
];

describe("lookupDirectoryName", () => {
  it("returns directory name when present", () => {
    expect(lookupDirectoryName(users, "u1")).toBe("Alice Current");
  });

  it("returns undefined when users missing or id unknown", () => {
    expect(lookupDirectoryName(null, "u1")).toBeUndefined();
    expect(lookupDirectoryName(users, "missing")).toBeUndefined();
  });
});

describe("resolveDisplayName", () => {
  it("prefers directory name over snapshot", () => {
    expect(
      resolveDisplayName({ id: "u1", name: "Alice Old" }, users)
    ).toBe("Alice Current");
  });

  it("falls back to snapshot when directory not loaded", () => {
    expect(resolveDisplayName({ id: "u1", name: "Alice Old" }, null)).toBe(
      "Alice Old"
    );
  });

  it("formats bots from directory", () => {
    expect(resolveDisplayName({ id: "bot1", name: "Stale" }, users)).toBe(
      `${BOT_DISPLAY_PREFIX}Test Bot`
    );
  });

  it("handles missing id with name only", () => {
    expect(resolveDisplayName({ name: "Someone" }, users)).toBe("Someone");
  });
});
