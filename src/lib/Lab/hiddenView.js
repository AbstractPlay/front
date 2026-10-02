import { GameFactory } from "@abstractplay/gameslib";
import { resolveMoveTableExportEngine } from "../GameMove/moveTableLayout.js";

/** @typedef {'god' | 'live'} LabHiddenViewMode */

export const LAB_HIDDEN_VIEW_GOD = "god";
export const LAB_HIDDEN_VIEW_LIVE = "live";

/** @param {unknown} viewMode */
export function normalizeLabHiddenViewMode(viewMode) {
  return viewMode === LAB_HIDDEN_VIEW_LIVE ? LAB_HIDDEN_VIEW_LIVE : LAB_HIDDEN_VIEW_GOD;
}

/** True when `serialize({ strip, player })` can differ by viewer. */
export function engineSupportsPlayerStrip(engine) {
  if (!engine || typeof engine.serialize !== "function") {
    return false;
  }
  try {
    if (engine.numplayers >= 2) {
      const s1 = engine.serialize({ strip: true, player: 1 });
      const s2 = engine.serialize({ strip: true, player: 2 });
      return s1 !== s2;
    }
    const full = engine.serialize();
    const stripped = engine.serialize({ strip: true, player: 1 });
    return full !== stripped;
  } catch {
    return false;
  }
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} [_activeSeat] reserved for simultaneous seat perspective
 */
export function liveStripPlayer(engine, _activeSeat) {
  return engine.currplayer;
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {LabHiddenViewMode} viewMode
 */
export function shouldStripForLiveView(engine, viewMode) {
  return (
    normalizeLabHiddenViewMode(viewMode) === LAB_HIDDEN_VIEW_LIVE &&
    !engine.gameover &&
    engineSupportsPlayerStrip(engine)
  );
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} player 1-based
 */
export function serializeForLiveView(engine, player) {
  if (typeof engine.serialize === "function") {
    try {
      return engine.serialize({ strip: true, player });
    } catch {
      return engine.serialize();
    }
  }
  return engine.serialize();
}

/**
 * @param {string} metaGame
 * @param {import("@abstractplay/gameslib").GameBase} fullEngine
 * @param {LabHiddenViewMode} viewMode
 */
export function createLabViewEngine(metaGame, fullEngine, viewMode) {
  if (!shouldStripForLiveView(fullEngine, viewMode)) {
    return fullEngine;
  }
  const player = liveStripPlayer(fullEngine);
  return GameFactory(metaGame, serializeForLiveView(fullEngine, player));
}

/**
 * @param {string} metaGame
 * @param {import("@abstractplay/gameslib").GameBase} fullEngine
 * @param {LabHiddenViewMode} viewMode
 */
export function resolveLabDisplayEngines(metaGame, fullEngine, viewMode) {
  const viewEngine = createLabViewEngine(metaGame, fullEngine, viewMode);
  return { fullEngine, viewEngine };
}

/**
 * Extra opts for `engine.render()` in Lab. God mode lifts hidden-information rendering
 * (`IRenderOpts.omniscient`); Live uses stripped state plus seat perspective.
 *
 * @param {import("@abstractplay/gameslib").GameBase} viewEngine
 * @param {LabHiddenViewMode} hiddenViewMode
 * @returns {Record<string, unknown>}
 */
export function labRenderExtras(viewEngine, hiddenViewMode) {
  const extras = { perspective: viewEngine.currplayer };
  if (normalizeLabHiddenViewMode(hiddenViewMode) === LAB_HIDDEN_VIEW_GOD) {
    extras.omniscient = true;
  }
  return extras;
}

/**
 * Move-list label at `moveNumber` using gameslib strip rules (e.g. AoM setup redaction).
 *
 * @param {string} metaGame
 * @param {string | undefined} tipState full serialized state at current focus
 * @param {number} moveNumber spine index (matches exploration node index)
 * @param {string} label stored wire move on the exploration node
 * @param {LabHiddenViewMode} hiddenViewMode
 */
export function labDisplayMoveLabel(
  metaGame,
  tipState,
  moveNumber,
  label,
  hiddenViewMode
) {
  if (
    !label ||
    normalizeLabHiddenViewMode(hiddenViewMode) !== LAB_HIDDEN_VIEW_LIVE ||
    !tipState
  ) {
    return label;
  }
  try {
    const full = GameFactory(metaGame, tipState);
    if (!shouldStripForLiveView(full, LAB_HIDDEN_VIEW_LIVE)) {
      return label;
    }
    const player = liveStripPlayer(full);
    const stripped = JSON.parse(serializeForLiveView(full, player));
    const fullStack = JSON.parse(full.serialize()).stack;
    const entry = stripped.stack?.[moveNumber];
    if (
      entry?.lastmove !== undefined &&
      fullStack?.[moveNumber]?.lastmove === label
    ) {
      return entry.lastmove;
    }
  } catch {
    return label;
  }
  return label;
}

/**
 * Engine for move-tree round grid (getRounds / getPlies). Live mode uses stripped state
 * so gameslib moveHistory / stack plies match live play (e.g. AoM setup redaction).
 *
 * @param {string} metaGame
 * @param {import("@abstractplay/gameslib").GameBase | null | undefined} focusEngine
 * @param {number} pathLength
 * @param {string | undefined} exportState
 * @param {LabHiddenViewMode} hiddenViewMode
 */
export function resolveLabMoveTableEngine(
  metaGame,
  focusEngine,
  pathLength,
  exportState,
  hiddenViewMode
) {
  const fullTableEngine = resolveMoveTableExportEngine(
    focusEngine,
    pathLength,
    exportState,
    GameFactory,
    metaGame
  );
  if (normalizeLabHiddenViewMode(hiddenViewMode) !== LAB_HIDDEN_VIEW_LIVE) {
    return fullTableEngine;
  }
  const referenceState = exportState;
  if (!referenceState) {
    return fullTableEngine;
  }
  try {
    const full = GameFactory(metaGame, referenceState);
    if (!shouldStripForLiveView(full, LAB_HIDDEN_VIEW_LIVE)) {
      return fullTableEngine;
    }
    const player = liveStripPlayer(full);
    const view = createLabViewEngine(metaGame, full, LAB_HIDDEN_VIEW_LIVE);
    const strippedState = serializeForLiveView(full, player);
    return (
      resolveMoveTableExportEngine(
        view,
        pathLength,
        strippedState,
        GameFactory,
        metaGame
      ) ?? view
    );
  } catch {
    return fullTableEngine;
  }
}
