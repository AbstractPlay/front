import { assertGameMoveReplayBundle } from "./bundleFormat.js";
import { isGameMoveReplayEnabled } from "./replayEnabled.js";
import { importReplayBundleBySlug } from "../fixtures/replays/registry.js";
import {
  mergeExploration,
  mergePrivateExploration,
} from "../exploration.js";

/** @type {import('./bundleFormat').GameMoveReplayBundle | null} */
let activeBundle = null;
let viewAsOverride = null;

const MUTATION_QUERIES = new Set([
  "submit_move",
  "update_note",
  "mark_published",
  "set_game_state",
  "update_commented",
  "resign",
  "pie",
  "keep",
  "undo",
  "teaching_undo",
  "save_exploration",
  "delete_exploration",
  "next_game",
]);

function defaultExplorerSettings() {
  return { all: { exploration: 1 } };
}

/**
 * API/DDB store tip trees as a JSON array; some captures used `{ children: [...] }`.
 * @param {unknown} tree
 * @returns {unknown}
 */
export function normalizeReplayExplorationTree(tree) {
  if (typeof tree === "string") {
    try {
      return JSON.parse(tree);
    } catch {
      return tree;
    }
  }
  if (
    tree &&
    typeof tree === "object" &&
    !Array.isArray(tree) &&
    Array.isArray(tree.children)
  ) {
    return tree.children;
  }
  return tree;
}

/**
 * Merge committed replay bundle exploration into the live spine (reporter view).
 * @returns {boolean} whether any rows were applied
 */
export function applyReplayBundleExploration(
  game,
  explorationNodes,
  me,
  errorSetter,
  errorMessageRef
) {
  if (!isReplayActive() || !activeBundle || !game || !explorationNodes?.length) {
    return false;
  }
  let applied = false;
  for (const row of activeBundle.explorationRows ?? []) {
    if (!row || row.move == null || row.tree == null) {
      continue;
    }
    const tree = normalizeReplayExplorationTree(row.tree);
    mergeExploration(
      game,
      explorationNodes,
      [{ move: row.move, tree }],
      me,
      errorSetter,
      errorMessageRef
    );
    applied = true;
  }
  const privateRows = activeBundle.privateExploration ?? [];
  if (privateRows.length > 0) {
    const data = privateRows.map((d) => {
      if (!d) {
        return d;
      }
      return {
        ...d,
        tree: normalizeReplayExplorationTree(d.tree),
      };
    });
    mergePrivateExploration(
      game,
      explorationNodes,
      data,
      me,
      errorSetter,
      errorMessageRef
    );
    applied = true;
  }
  return applied;
}

export function isReplayActive() {
  return isGameMoveReplayEnabled() && activeBundle !== null;
}

export function isReplayReadOnly() {
  return isReplayActive();
}

export function getReplayRoute() {
  return activeBundle?.route ?? null;
}

/**
 * @param {import('../../stores').GlobalMe | null | undefined} globalMe
 */
export function getEffectiveSessionMe(globalMe) {
  if (!isReplayActive() || !activeBundle) {
    return globalMe;
  }
  const playerId = viewAsOverride ?? activeBundle.viewAs.playerId;
  const settings =
    activeBundle.viewAs.settings ??
    globalMe?.settings ??
    defaultExplorerSettings();
  return {
    ...(globalMe ?? {}),
    id: playerId,
    settings,
  };
}

function authEnvelope(data) {
  return new Response(
    JSON.stringify({
      statusCode: 200,
      body: JSON.stringify(data),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function mutationNoopEnvelope() {
  return authEnvelope({ ok: true });
}

/**
 * @param {string} query
 * @param {Record<string, unknown>} pars
 */
export function maybeReplayAuthResponse(query, pars) {
  if (!isReplayActive() || !activeBundle) {
    return null;
  }

  if (MUTATION_QUERIES.has(query)) {
    return mutationNoopEnvelope();
  }

  if (query === "get_game") {
    const route = activeBundle.route;
    if (
      pars?.id !== route.gameID ||
      pars?.metaGame !== route.metaGame ||
      Number(pars?.cbit) !== Number(route.cbits)
    ) {
      return authEnvelope({ message: "Replay route mismatch" });
    }
    const game = { ...activeBundle.game };
    if (isReplayReadOnly()) {
      game.canSubmit = false;
    }
    return authEnvelope({
      game,
      watchCount: activeBundle.watchCount ?? 0,
      comments: activeBundle.comments ?? [],
    });
  }

  if (query === "get_exploration") {
    const rows = activeBundle.explorationRows ?? [];
    const move = Number(pars?.move);
    const filtered = rows.filter((row) => row && row.move === move);
    return authEnvelope(filtered.length > 0 ? filtered : rows);
  }

  if (query === "get_private_exploration") {
    return authEnvelope(activeBundle.privateExploration ?? []);
  }

  return null;
}

/**
 * @param {string} query
 * @param {Record<string, string>} params
 */
export async function maybeReplayOpenQuery(query, params) {
  if (!isReplayActive() || !activeBundle) {
    return null;
  }
  if (query !== "get_public_exploration") {
    return null;
  }
  if (params.game && params.game !== activeBundle.route.gameID) {
    return null;
  }
  return activeBundle.publicExploration ?? [];
}

/**
 * @param {{ meta?: string; id?: string }} detail
 */
export function shouldIgnoreGameRefreshForReplay(detail) {
  if (!isReplayActive() || !activeBundle) {
    return false;
  }
  const route = activeBundle.route;
  return detail?.meta === route.metaGame && detail?.id === route.gameID;
}

/**
 * @param {string} search
 * @returns {Promise<boolean>}
 */
export async function activateReplayFromSearchParams(search) {
  if (!isGameMoveReplayEnabled()) {
    activeBundle = null;
    viewAsOverride = null;
    return false;
  }

  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const slug = params.get("replay")?.trim();
  if (!slug) {
    activeBundle = null;
    viewAsOverride = null;
    return false;
  }

  const mod = await importReplayBundleBySlug(slug);
  const bundle = assertGameMoveReplayBundle(mod.default ?? mod);
  activeBundle = bundle;

  const viewAs = params.get("viewAs")?.trim();
  viewAsOverride = viewAs || null;

  return true;
}
