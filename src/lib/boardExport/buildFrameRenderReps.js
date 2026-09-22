import { GameFactory } from "@abstractplay/gameslib";
import { resolveRenderLabels } from "../resolveRenderLabels";
import { buildRenderDisplayOpts } from "../displaySettings.js";

export function buildFrameRenderRep({
  exploration,
  game,
  focus,
  getFocusNode,
  players,
  users,
  getPerspective,
  display,
  /** @deprecated use display */
  altDisplay,
}) {
  const node = getFocusNode(exploration, game, focus);
  if (!node?.state) {
    throw new Error("Missing game state for export frame");
  }
  const engine = GameFactory(game.metaGame, node.state);
  const perspective = getPerspective(engine, game);
  const displayUids = display ?? altDisplay;
  const rep = engine.render(
    buildRenderDisplayOpts(game.metaGame, displayUids, { perspective })
  );
  if (players?.length) {
    return resolveRenderLabels(rep, players, users ?? {});
  }
  return rep;
}
