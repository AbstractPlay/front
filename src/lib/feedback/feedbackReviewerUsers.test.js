import { describe, expect, it } from "vitest";
import {
  getCoderUserIds,
  groupUsersForReviewerPicker,
  isPriorityReviewerUser,
} from "./feedbackReviewerUsers";

describe("feedbackReviewerUsers", () => {
  const coderIds = new Set(["coder-1"]);

  it("treats admins and coders as priority users", () => {
    expect(isPriorityReviewerUser({ id: "admin-1", admin: true }, coderIds)).toBe(true);
    expect(isPriorityReviewerUser({ id: "coder-1" }, coderIds)).toBe(true);
    expect(isPriorityReviewerUser({ id: "player-1" }, coderIds)).toBe(false);
  });

  it("groups users with admins and coders first", () => {
    const users = [
      { id: "player-1", name: "Zoe" },
      { id: "admin-1", name: "Aaron", admin: true },
      { id: "coder-1", name: "Bob" },
      { id: "bot-1", name: "Bot", bot: true },
    ];
    const grouped = groupUsersForReviewerPicker(users, { coderUserIds: coderIds, language: "en" });
    expect(grouped.priority.map((user) => user.id)).toEqual(["admin-1", "coder-1"]);
    expect(grouped.others.map((user) => user.id)).toEqual(["player-1"]);
  });

  it("builds coder ids from gameslib", () => {
    expect(getCoderUserIds().size).toBeGreaterThan(0);
  });
});
