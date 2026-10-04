import { GameFactory } from "@abstractplay/gameslib";
import { resolveMoveTableExportEngine } from "../GameMove/moveTableLayout.js";

/** @typedef {'god' | 'live'} LabHiddenViewMode */

export const LAB_HIDDEN_VIEW_GOD = "god";
export const LAB_HIDDEN_VIEW_LIVE = "live";

/** @param {unknown} viewMode */
export function normalizeLabHiddenViewMode(viewMode) {
  return viewMode === LAB_HIDDEN_VIEW_LIVE ? LAB_HIDDEN_VIEW_LIVE : LAB_HIDDEN_VIEW_GOD;
}

/**
 * Probe strip capability on a throwaway engine built from full state (never mutates
 * the caller's live instance when gameslib strip export touches stack frames).
 *
 * @param {string} metaGame
 * @param {string} fullState
 */
export function stateSupportsPlayerStrip(metaGame, fullState) {
  if (!metaGame || !fullState) {
    return false;
  }
  try {
    const probe = GameFactory(metaGame, fullState);
    if (typeof probe.serialize !== "function") {
      return false;
    }
    if (probe.numplayers >= 2) {
      const s1 = probe.serialize({ strip: true, player: 1 });
      const s2 = probe.serialize({ strip: true, player: 2 });
      return s1 !== s2;
    }
    const full = probe.serialize();
    const stripped = probe.serialize({ strip: true, player: 1 });
    return full !== stripped;
  } catch {
    return false;
  }
}

/** True when `serialize({ strip, player })` can differ by viewer. */
export function engineSupportsPlayerStrip(engine) {
  if (!engine || typeof engine.serialize !== "function" || !engine.metaGame) {
    return false;
  }
  try {
    return stateSupportsPlayerStrip(engine.metaGame, engine.serialize());
  } catch {
    return false;
  }
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} [activeSeat] 1-based Lab seat when simultaneous
 */
export function liveStripPlayer(engine, activeSeat) {
  if (typeof activeSeat === "number" && activeSeat >= 1) {
    return activeSeat;
  }
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
  if (typeof engine.serialize !== "function" || !engine.metaGame) {
    return engine.serialize();
  }
  try {
    const fullState = engine.serialize();
    const probe = GameFactory(engine.metaGame, fullState);
    return probe.serialize({ strip: true, player });
  } catch {
    return engine.serialize();
  }
}

/**
 * @param {string} metaGame
 * @param {import("@abstractplay/gameslib").GameBase} fullEngine
 * @param {LabHiddenViewMode} viewMode
 */
export function createLabViewEngine(
  metaGame,
  fullEngine,
  viewMode,
  activeSeat
) {
  if (!shouldStripForLiveView(fullEngine, viewMode)) {
    return fullEngine;
  }
  const player = liveStripPlayer(fullEngine, activeSeat);
  return GameFactory(metaGame, serializeForLiveView(fullEngine, player));
}

/**
 * @param {string} metaGame
 * @param {import("@abstractplay/gameslib").GameBase} fullEngine
 * @param {LabHiddenViewMode} viewMode
 */
export function resolveLabDisplayEngines(
  metaGame,
  fullEngine,
  viewMode,
  activeSeat
) {
  const viewEngine = createLabViewEngine(
    metaGame,
    fullEngine,
    viewMode,
    activeSeat
  );
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
export function labRenderExtras(viewEngine, hiddenViewMode, activeSeat) {
  const perspective =
    typeof activeSeat === "number" && activeSeat >= 1
      ? activeSeat
      : viewEngine.currplayer;
  const extras = { perspective };
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
