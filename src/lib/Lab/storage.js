import { nanoid } from "nanoid";

const STORAGE_KEY = "ap-lab-saves";
const BOARD_SETTINGS_KEY = "ap-lab-board-settings";

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

export function createSaveRecord({
  name,
  metaGame,
  state,
  variants = [],
  playerCount,
  exploration = null,
  moveAnnotations = null,
  gameSettings = {},
  id,
}) {
  const record = {
    id: id ?? nanoid(),
    name,
    metaGame,
    state,
    variants,
    playerCount,
    exploration,
    gameSettings,
    savedAt: Date.now(),
  };
  if (moveAnnotations) {
    record.moveAnnotations = moveAnnotations;
  }
  return record;
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
  });
}
