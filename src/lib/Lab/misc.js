import { useStore } from "../../stores";
import { resolveRenderLabels } from "../resolveRenderLabels";
import {
  resolveSidebarScores,
  resolveSidebarStatuses,
} from "../resolveSidebarStatus";

export { resolveRenderLabels };
export { resolveSidebarStatuses, resolveSidebarScores };

export function setStatus(engine, game, isPartial, partialMove, status) {
  const users = useStore.getState().users;
  const players = game.players ?? [];
  status.statuses = resolveSidebarStatuses(
    engine.sidebarStatuses(isPartial, partialMove),
    players,
    users
  );
  status.scores = resolveSidebarScores(
    engine.sidebarScores(),
    players,
    users
  );
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
