import { describe, expect, it } from "vitest";
import { submitMoveOpponentId } from "./submitMoveOpponentId";

describe("submitMoveOpponentId", () => {
  it("returns the other seat in a two-player game", () => {
    const players = [{ id: "a" }, { id: "b" }];
    expect(submitMoveOpponentId(players, "a")).toBe("b");
    expect(submitMoveOpponentId(players, "b")).toBe("a");
  });

  it("does not return the submitting player", () => {
    const players = [{ id: "me" }, { id: "them" }];
    expect(submitMoveOpponentId(players, "me")).not.toBe("me");
  });
});
