import { describe, expect, it, beforeEach } from "vitest";
import {
  MOVE_ENTRY_TEXTAREA_STORAGE_KEY,
  readMoveEntryTextareaMode,
  writeMoveEntryTextareaMode,
} from "./moveEntryTextareaPreference";

describe("moveEntryTextareaPreference", () => {
  beforeEach(() => {
    localStorage.removeItem(MOVE_ENTRY_TEXTAREA_STORAGE_KEY);
  });

  it("defaults to false when unset", () => {
    expect(readMoveEntryTextareaMode()).toBe(false);
  });

  it("round-trips enabled flag", () => {
    writeMoveEntryTextareaMode(true);
    expect(readMoveEntryTextareaMode()).toBe(true);
    writeMoveEntryTextareaMode(false);
    expect(readMoveEntryTextareaMode()).toBe(false);
  });
});
