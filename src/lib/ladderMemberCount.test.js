import { describe, expect, it, vi } from "vitest";
import { formatLadderMemberCount } from "./ladderMemberCount.js";

describe("formatLadderMemberCount", () => {
  const t = vi.fn((key, opts) => `${key}:${JSON.stringify(opts)}`);

  it("omits activation hint when active", () => {
    formatLadderMemberCount(t, { count: 4, min: 4, status: "active" });
    expect(t).toHaveBeenCalledWith("Ladder.memberCount", { count: 4 });
  });

  it("shows activation hint when forming or suspended", () => {
    formatLadderMemberCount(t, { count: 2, min: 4, status: "forming" });
    expect(t).toHaveBeenLastCalledWith("Ladder.memberCountForming", {
      count: 2,
      min: 4,
    });
    formatLadderMemberCount(t, { count: 3, min: 4, status: "suspended" });
    expect(t).toHaveBeenLastCalledWith("Ladder.memberCountForming", {
      count: 3,
      min: 4,
    });
  });
});
