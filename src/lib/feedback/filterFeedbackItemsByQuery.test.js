import { describe, expect, it } from "vitest";
import { filterFeedbackItemsByQuery } from "./filterFeedbackItemsByQuery";

describe("filterFeedbackItemsByQuery", () => {
  const items = [
    {
      id: "1",
      title: "Dark mode",
      authorName: "alice",
      body: "Please add a theme toggle.",
    },
    {
      id: "2",
      title: "Catan",
      authorName: "bob",
      gameUrl: "https://boardgamegeek.com/boardgame/13/catan",
    },
  ];

  it("returns all items when query is empty", () => {
    expect(filterFeedbackItemsByQuery(items, "")).toHaveLength(2);
    expect(filterFeedbackItemsByQuery(items, "   ")).toHaveLength(2);
  });

  it("matches title and author", () => {
    expect(filterFeedbackItemsByQuery(items, "alice")).toHaveLength(1);
    expect(filterFeedbackItemsByQuery(items, "dark")).toHaveLength(1);
  });

  it("matches body substring", () => {
    expect(filterFeedbackItemsByQuery(items, "theme toggle")).toHaveLength(1);
  });

  it("requires all tokens to match", () => {
    expect(filterFeedbackItemsByQuery(items, "dark alice")).toHaveLength(1);
    expect(filterFeedbackItemsByQuery(items, "dark bob")).toHaveLength(0);
  });

  it("treats leading and trailing space like an untrimmed query", () => {
    expect(filterFeedbackItemsByQuery(items, "dark")).toHaveLength(1);
    expect(filterFeedbackItemsByQuery(items, "  dark  ")).toHaveLength(1);
  });

  it("matches case-insensitively", () => {
    expect(filterFeedbackItemsByQuery(items, "DARK")).toHaveLength(1);
    expect(filterFeedbackItemsByQuery(items, "ALICE")).toHaveLength(1);
    expect(filterFeedbackItemsByQuery(items, "dark ALICE")).toHaveLength(1);
  });
});
