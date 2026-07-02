import { GameFactory, gameinfo } from "@abstractplay/gameslib";
import { nanoid } from "nanoid";

export const LAB_ME = {
  id: "lab-p0",
  settings: { all: { exploration: 1 } },
};

export function isLabSupportedGame(metaGame) {
  const info = gameinfo.get(metaGame);
  if (!info) return false;
  return !info.flags.includes("simultaneous");
}

export function assertLabSupportedGame(metaGame) {
  if (!isLabSupportedGame(metaGame)) {
    const info = gameinfo.get(metaGame);
    const name = info?.name ?? metaGame;
    throw new Error(
      `${name} is not supported in Lab. Simultaneous games are not available.`
    );
  }
}

export function getLabPlayerCounts(metaGame) {
  const info = gameinfo.get(metaGame);
  if (!info) return [];
  return [...info.playercounts];
}

export function listLabGames() {
  let lst = [];
  for (const info of gameinfo.values()) {
    if (isLabSupportedGame(info.uid)) {
      lst.push({ uid: info.uid, name: info.name, info });
    }
  }
  if (process.env.REACT_APP_REAL_MODE === "production") {
    lst = lst.filter(({ info }) => !info.flags.includes("experimental"));
  }
  lst.sort((a, b) => a.name.localeCompare(b.name));
  return lst;
}

export function createEngine(
  metaGame,
  { variants = [], state, numPlayers } = {}
) {
  const info = gameinfo.get(metaGame);
  if (!info) {
    throw new Error(`Unknown game: ${metaGame}`);
  }
  assertLabSupportedGame(metaGame);
  if (state !== undefined && state !== null && state !== "") {
    return GameFactory(metaGame, state);
  }
  // Only pass a player count when the game supports multiple counts.
  // Games with a single playercount (e.g. [2]) must use the no-arg form.
  if (info.playercounts.length > 1) {
    const count = numPlayers ?? info.playercounts[0];
    return GameFactory(metaGame, count, variants);
  }
  if (variants.length > 0) {
    return GameFactory(metaGame, undefined, variants);
  }
  return GameFactory(metaGame);
}

export function parsePastedState(rawState) {
  const trimmed = rawState.trim();
  if (!trimmed) {
    throw new Error("Paste a game state to load.");
  }
  let metaGame;
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed);
    metaGame = obj.game;
  }
  if (!metaGame || !gameinfo.get(metaGame)) {
    throw new Error("Could not determine game from pasted state.");
  }
  assertLabSupportedGame(metaGame);
  const engine = GameFactory(metaGame, trimmed);
  return { metaGame, state: engine.serialize() };
}

export function buildLabGame(metaGame, state, options = {}) {
  const { variants = [], numPlayers } = options;
  assertLabSupportedGame(metaGame);

  const engine = createEngine(metaGame, { variants, state, numPlayers });
  const serialized = engine.serialize();
  const playerCount = engine.numplayers;

  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `lab-p${i}`,
    name: `Player ${i + 1}`,
  }));

  const toMove = engine.gameover ? "" : String(engine.currplayer - 1);

  return {
    id: `lab-${nanoid()}`,
    metaGame,
    state: serialized,
    numPlayers: playerCount,
    players,
    toMove,
    rated: false,
    variants:
      typeof engine.getVariants === "function" ? engine.getVariants() : [],
    selectedVariants: variants,
  };
}
