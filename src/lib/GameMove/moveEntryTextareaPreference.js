export const MOVE_ENTRY_TEXTAREA_STORAGE_KEY = "gameMove:textareaMode";

function readStorage() {
  try {
    return localStorage.getItem(MOVE_ENTRY_TEXTAREA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    localStorage.setItem(MOVE_ENTRY_TEXTAREA_STORAGE_KEY, value);
  } catch {
    // ignore quota / private browsing
  }
}

export function readMoveEntryTextareaMode() {
  return readStorage() === "1";
}

export function writeMoveEntryTextareaMode(enabled) {
  writeStorage(enabled ? "1" : "0");
}
