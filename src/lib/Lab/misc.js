import { formatPlayerDisplayName } from "../../components/Bots/botUtils";

export const replaceNames = (rep, players, users) => {
  let stringRep = JSON.stringify(rep);
  for (let i = 0; i < players.length; i++) {
    const re = new RegExp(`player ${i + 1}`, "gi");
    stringRep = stringRep.replace(
      re,
      formatPlayerDisplayName(players[i], users)
    );
  }
  return JSON.parse(stringRep);
};

export function setStatus(engine, game, isPartial, partialMove, status) {
  status.statuses = engine.sidebarStatuses(isPartial, partialMove);
  status.scores = engine.sidebarScores();
  if (game.playerStashes) {
    status.stashes = [];
    for (let i = 1; i <= game.numPlayers; i++) {
      const stash = engine.getPlayerStash(i);
      status.stashes.push(stash);
    }
  }
  if (game.sharedStash) {
    status.sharedstash = engine.getSharedStash(isPartial, partialMove);
  }
}
