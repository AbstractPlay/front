import { describe, expect, it } from "vitest";
import {
  canCommentTournamentChat,
  tournamentChatPlayers,
} from "./tournamentChat.js";

describe("canCommentTournamentChat", () => {
  it("allows admin", () => {
    expect(canCommentTournamentChat({ id: "a", admin: true }, [])).toBe(true);
  });

  it("allows participant", () => {
    expect(
      canCommentTournamentChat(
        { id: "p1" },
        [{ playerid: "p1", playername: "Pat" }],
      ),
    ).toBe(true);
    expect(
      canCommentTournamentChat(
        { id: "other" },
        [{ playerid: "p1", playername: "Pat" }],
      ),
    ).toBe(false);
  });
});

describe("tournamentChatPlayers", () => {
  it("maps ids and names", () => {
    expect(
      tournamentChatPlayers([
        { playerid: "p1", playername: "Pat" },
        { playerid: "", playername: "X" },
      ]),
    ).toEqual([{ id: "p1", name: "Pat" }]);
  });
});
