import { nanoid } from "nanoid";
import {
  buildPlaygroundSaveBody,
  bodyFromLocalSaveRecord,
  toLocalSaveRecord,
} from "./savePayload";

const STORAGE_KEY = "ap-lab-saves";
const BOARD_SETTINGS_KEY = "ap-lab-board-settings";
const IMPORT_DISMISS_KEY = "ap-lab-import-dismissed";

function defaultBoardSettings() {
  return { all: { annotate: true } };
}

function emptyStorage() {
  return { version: 1, saves: [], lastSession: null };
}

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    return JSON.parse(raw);
  } catch {
    return emptyStorage();
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listSaves() {
  return loadStorage().saves.sort((a, b) => b.savedAt - a.savedAt);
}

export function getSave(id) {
  return loadStorage().saves.find((s) => s.id === id);
}

export function addSave(entry) {
  const data = loadStorage();
  data.saves = data.saves.filter((s) => s.id !== entry.id);
  data.saves.push(entry);
  writeStorage(data);
}

export function deleteSave(id) {
  const data = loadStorage();
  data.saves = data.saves.filter((s) => s.id !== id);
  writeStorage(data);
}

export function removeSavesById(ids) {
  const idSet = new Set(ids);
  const data = loadStorage();
  data.saves = data.saves.filter((s) => !idSet.has(s.id));
  writeStorage(data);
}

/**
 * @param {{ name: string, metaGame: string, game: object, nodes: object[], focus: object, gameSettings?: object, id?: string, savedAt?: number }} fields
 */
export function createSaveRecord({
  name,
  metaGame,
  game,
  nodes,
  focus,
  gameSettings = {},
  id,
  savedAt,
}) {
  const body = buildPlaygroundSaveBody({
    game,
    nodes,
    focus,
    gameSettings,
  });
  return toLocalSaveRecord({
    id: id ?? nanoid(),
    name,
    metaGame,
    savedAt: savedAt ?? Date.now(),
    body,
  });
}

/**
 * Convert a local save record to launch payload fields.
 * @param {Record<string, unknown>} record
 */
export function localSaveToLaunchPayload(record) {
  const body = bodyFromLocalSaveRecord(record);
  return {
    id: record.id,
    name: record.name,
    metaGame: record.metaGame,
    source: "local",
    state: body.state,
    variants: body.variants,
    playerCount: body.playerCount,
    exploration: body.exploration,
    moveAnnotations: body.moveAnnotations,
    focus: body.focus,
    gameSettings: body.gameSettings,
  };
}

export function saveLastSession(session) {
  const data = loadStorage();
  data.lastSession = { ...session, savedAt: Date.now() };
  writeStorage(data);
}

export function getLastSession() {
  return loadStorage().lastSession;
}

export function clearLastSession() {
  const data = loadStorage();
  data.lastSession = null;
  writeStorage(data);
}

export function getLabBoardSettings() {
  try {
    const raw = localStorage.getItem(BOARD_SETTINGS_KEY);
    if (!raw) return defaultBoardSettings();
    return JSON.parse(raw);
  } catch {
    return defaultBoardSettings();
  }
}

export function saveLabBoardSettings(settings) {
  localStorage.setItem(BOARD_SETTINGS_KEY, JSON.stringify(settings));
}

export function launchLabFromExport({
  metaGame,
  state,
  variants = [],
  playerCount,
  focus = null,
  exploration = null,
  name,
}) {
  const focusPoint = focus ?? { moveNumber: 0, exPath: [] };
  saveLastSession({
    id: nanoid(),
    name,
    metaGame,
    state,
    variants,
    playerCount,
    focus: {
      moveNumber: focusPoint.moveNumber,
      exPath: [...(focusPoint.exPath ?? [])],
    },
    exploration,
    explorationFormat: 2,
    gameSettings: {},
    loadedSave: null,
  });
}

function localSaveFingerprint(saves) {
  return saves.map((s) => s.id).sort().join(",");
}

export function shouldShowImportBanner(saves) {
  if (!saves?.length) return false;
  try {
    const dismissed = localStorage.getItem(IMPORT_DISMISS_KEY);
    return dismissed !== localSaveFingerprint(saves);
  } catch {
    return true;
  }
}

export function dismissImportBanner(saves) {
  localStorage.setItem(IMPORT_DISMISS_KEY, localSaveFingerprint(saves));
}
