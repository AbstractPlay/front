import { describe, expect, it } from "vitest";
import {
  announcementsCursorIsUnset,
  announcementsLastReadAt,
  maxPublishedAt,
} from "./useAnnouncementUnread";

describe("announcementsCursorIsUnset", () => {
  it("is true when field is missing", () => {
    expect(announcementsCursorIsUnset({ id: "u1", settings: { all: {} } })).toBe(true);
    expect(announcementsCursorIsUnset({ id: "u1", settings: {} })).toBe(true);
  });

  it("is false when cursor is set", () => {
    expect(announcementsCursorIsUnset({
      id: "u1",
      settings: { all: { announcementsLastReadAt: 100 } },
    })).toBe(false);
  });
});

describe("announcementsLastReadAt", () => {
  it("returns null when unset", () => {
    expect(announcementsLastReadAt({ id: "u1", settings: { all: {} } })).toBe(null);
  });
});

describe("maxPublishedAt", () => {
  it("returns max timestamp", () => {
    expect(maxPublishedAt([
      { publishedAt: 10 },
      { time: 50 },
    ])).toBe(50);
  });
});
