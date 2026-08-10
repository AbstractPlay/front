import {
  sanitizeFocus,
  serializeSessionExploration,
  serializeMainLineAnnotations,
  getMainLineTipState,
} from "./exploration";

export const PLAYGROUND_SAVE_BODY_VERSION = 1;

/**
 * @typedef {object} PlaygroundSaveBody
 * @property {number} version
 * @property {string} state
 * @property {string[]} variants
 * @property {number} playerCount
 * @property {{ moveNumber: number, exPath: number[] }} focus
 * @property {unknown} exploration
 * @property {number} explorationFormat
 * @property {unknown} [moveAnnotations]
 * @property {Record<string, unknown>} gameSettings
 */

/**
 * @param {{ game: object, nodes: object[], focus: object, gameSettings?: Record<string, unknown> }} session
 * @returns {PlaygroundSaveBody}
 */
export function buildPlaygroundSaveBody({
  game,
  nodes,
  focus,
  gameSettings = {},
}) {
  const safeFocus = sanitizeFocus(nodes, focus);
  const body = {
    version: PLAYGROUND_SAVE_BODY_VERSION,
    state: getMainLineTipState(nodes, game),
    variants: game.selectedVariants ?? [],
    playerCount: game.numPlayers,
    focus: {
      moveNumber: safeFocus.moveNumber,
      exPath: [...safeFocus.exPath],
    },
    exploration: serializeSessionExploration(nodes, game.gameOver),
    explorationFormat: 2,
    gameSettings: gameSettings ?? {},
  };
  const moveAnnotations = serializeMainLineAnnotations(nodes);
  if (moveAnnotations) {
    body.moveAnnotations = moveAnnotations;
  }
  return body;
}

/**
 * @param {PlaygroundSaveBody | Record<string, unknown>} body
 * @returns {PlaygroundSaveBody}
 */
export function parsePlaygroundSaveBody(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid playground save body.");
  }
  if (!body.state) {
    throw new Error("Playground save is missing state.");
  }
  return {
    version: body.version ?? PLAYGROUND_SAVE_BODY_VERSION,
    state: body.state,
    variants: body.variants ?? [],
    playerCount: body.playerCount,
    focus: body.focus ?? { moveNumber: 0, exPath: [] },
    exploration: body.exploration ?? null,
    explorationFormat: body.explorationFormat ?? 2,
    moveAnnotations: body.moveAnnotations ?? null,
    gameSettings: body.gameSettings ?? {},
  };
}

/**
 * Extract body fields from a local save record (legacy flattened or nested).
 * @param {Record<string, unknown>} record
 * @returns {PlaygroundSaveBody}
 */
export function bodyFromLocalSaveRecord(record) {
  return parsePlaygroundSaveBody({
    version: record.version ?? PLAYGROUND_SAVE_BODY_VERSION,
    state: record.state,
    variants: record.variants ?? [],
    playerCount: record.playerCount,
    focus: record.focus ?? { moveNumber: 0, exPath: [] },
    exploration: record.exploration ?? null,
    explorationFormat: record.explorationFormat ?? 2,
    moveAnnotations: record.moveAnnotations ?? null,
    gameSettings: record.gameSettings ?? {},
  });
}

/**
 * @param {{ id: string, name: string, metaGame: string, savedAt: number, body: PlaygroundSaveBody }} fields
 */
export function toLocalSaveRecord({ id, name, metaGame, savedAt, body }) {
  const parsed = parsePlaygroundSaveBody(body);
  const record = {
    id,
    name,
    metaGame,
    savedAt,
    version: parsed.version,
    state: parsed.state,
    variants: parsed.variants,
    playerCount: parsed.playerCount,
    focus: parsed.focus,
    exploration: parsed.exploration,
    explorationFormat: parsed.explorationFormat,
    gameSettings: parsed.gameSettings,
  };
  if (parsed.moveAnnotations) {
    record.moveAnnotations = parsed.moveAnnotations;
  }
  return record;
}

/**
 * JSON string for cloud API `body` field.
 * @param {PlaygroundSaveBody} body
 */
export function playgroundSaveBodyToJson(body) {
  return JSON.stringify(parsePlaygroundSaveBody(body));
}

/**
 * @param {string} json
 * @returns {PlaygroundSaveBody}
 */
export function playgroundSaveBodyFromJson(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Could not parse playground save body.");
  }
  return parsePlaygroundSaveBody(parsed);
}

/**
 * Fields needed to launch a lab session from a save.
 * @param {{ metaGame: string, body: PlaygroundSaveBody, id: string, name: string, source?: string }} save
 */
export function saveToLaunchPayload({ metaGame, body, id, name, source }) {
  const parsed = parsePlaygroundSaveBody(body);
  return {
    id,
    name,
    metaGame,
    source,
    state: parsed.state,
    variants: parsed.variants,
    playerCount: parsed.playerCount,
    exploration: parsed.exploration,
    moveAnnotations: parsed.moveAnnotations,
    focus: parsed.focus,
    gameSettings: parsed.gameSettings,
  };
}
