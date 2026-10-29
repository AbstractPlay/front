import { describe, expect, it } from "vitest";
import {
  canTakeSeatOnArenaTable,
  canTakeSeatOnArenaTableRow,
} from "./arenaTableSeating.js";

describe("arenaTableSeating", () => {
  it("allows only invitee on closed tables", () => {
    const table = {
      open: false,
      inviteUserId: "guest",
      state: "open",
      seats: [{ userId: "host" }, { userId: "" }],
      viewer: { seated: false },
    };
    expect(canTakeSeatOnArenaTable(table, "guest")).toBe(true);
    expect(canTakeSeatOnArenaTable(table, "other")).toBe(false);
  });

  it("allows anyone on open tables", () => {
    const table = {
      open: true,
      state: "open",
      seats: [{ userId: "host" }, { userId: "" }],
      viewer: { seated: false },
    };
    expect(canTakeSeatOnArenaTable(table, "anyone")).toBe(true);
  });

  it("list row mirrors closed invite rule", () => {
    expect(
      canTakeSeatOnArenaTableRow(
        { open: false, inviteUserId: "guest", tableId: "t1" },
        "guest"
      )
    ).toBe(true);
    expect(
      canTakeSeatOnArenaTableRow(
        { open: false, inviteUserId: "guest", tableId: "t1" },
        "other"
      )
    ).toBe(false);
  });

  it("blocks join when user is seated on another table", () => {
    expect(
      canTakeSeatOnArenaTableRow(
        { open: true, tableId: "other" },
        "u1",
        "mine"
      )
    ).toBe(false);
    expect(
      canTakeSeatOnArenaTableRow(
        { open: true, tableId: "mine" },
        "u1",
        "mine"
      )
    ).toBe(true);
  });
});
