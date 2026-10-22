import { describe, it, expect, beforeEach } from "vitest";
import {
  saveImportCheckpoint,
  getImportCheckpoint,
  clearImportCheckpoint,
  saveLastSession,
  loadStorage,
} from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("import checkpoint", () => {
  it("persists independently of lastSession autosave", () => {
    saveImportCheckpoint({
      metaGame: "chess",
      state: "{}",
      name: "imported",
    });
    saveLastSession({
      metaGame: "go",
      state: "{}",
      name: "explored",
    });

    expect(getImportCheckpoint()?.metaGame).toBe("chess");
    expect(getImportCheckpoint()?.name).toBe("imported");
    expect(loadStorage().lastSession.metaGame).toBe("go");
    expect(loadStorage().lastSession.name).toBe("explored");
  });

  it("clears checkpoint without removing saves list", () => {
    saveImportCheckpoint({
      metaGame: "hex",
      state: "s",
      name: "cp",
    });
    clearImportCheckpoint();
    expect(getImportCheckpoint()).toBeNull();
    expect(loadStorage().saves).toEqual([]);
  });
});
