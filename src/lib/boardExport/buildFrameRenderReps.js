import { GameFactory } from "@abstractplay/gameslib";
import { resolveRenderLabels } from "../resolveRenderLabels";

export function buildFrameRenderRep({
  exploration,
  game,
  focus,
  getFocusNode,
  players,
  users,
  getPerspective,
  altDisplay,
}) {
  const node = getFocusNode(exploration, game, focus);
  if (!node?.state) {
    throw new Error("Missing game state for export frame");
  }
  const engine = GameFactory(game.metaGame, node.state);
  const perspective = getPerspective(engine, game);
  const rep = engine.render({ perspective, altDisplay });
  if (players?.length) {
    return resolveRenderLabels(rep, players, users ?? {});
  }
  return rep;
}
