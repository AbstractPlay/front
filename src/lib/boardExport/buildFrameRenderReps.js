import { GameFactory } from "@abstractplay/gameslib";

export function buildFrameRenderRep({
  exploration,
  game,
  focus,
  getFocusNode,
  replaceNames,
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
  if (replaceNames && players?.length) {
    return replaceNames(rep, players, users ?? {});
  }
  return rep;
}
