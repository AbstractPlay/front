import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canCommentTournamentChat,
  tournamentChatPlayers,
} from "./tournamentChat.js";

test("canCommentTournamentChat allows admin", () => {
  assert.equal(
    canCommentTournamentChat({ id: "a", admin: true }, []),
    true,
  );
});

test("canCommentTournamentChat allows participant", () => {
  assert.equal(
    canCommentTournamentChat(
      { id: "p1" },
      [{ playerid: "p1", playername: "Pat" }],
    ),
    true,
  );
  assert.equal(
    canCommentTournamentChat(
      { id: "other" },
      [{ playerid: "p1", playername: "Pat" }],
    ),
    false,
  );
});

test("tournamentChatPlayers maps ids and names", () => {
  assert.deepEqual(
    tournamentChatPlayers([
      { playerid: "p1", playername: "Pat" },
      { playerid: "", playername: "X" },
    ]),
    [{ id: "p1", name: "Pat" }],
  );
});
