/**
 * Whether the signed-in user may post ladder hub chat.
 * @param {{ id?: string; admin?: boolean } | null | undefined} me
 * @param {{ membershipStatus?: string } | null | undefined} viewer
 */
export function canCommentLadderChat(me, viewer) {
  if (me?.id === undefined || me.id === "") {
    return false;
  }
  if (me.admin === true) {
    return true;
  }
  return viewer?.membershipStatus === "active";
}

import { lookupDirectoryName } from "../components/Bots/botUtils";

/** Map ladder board rows to UserChats `players` shape. */
export function ladderChatPlayers(boardRows, allUsers) {
  return (boardRows ?? [])
    .filter((row) => row.userid)
    .map((row) => {
      const name =
        lookupDirectoryName(allUsers, row.userid) ?? row.userid;
      return { id: row.userid, name };
    });
}
