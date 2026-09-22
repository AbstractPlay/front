import { describe, expect, it } from "vitest";
import {
  buildRenderDisplayOpts,
  canCycleBoardDisplay,
  displaySettingEqual,
  displaySettingForModal,
  displaySettingFromModal,
  nextBoardDisplayCycle,
  normalizeDisplaySetting,
  parseSessionDisplayOverride,
  serializeSessionDisplayOverride,
} from "./displaySettings.js";

describe("normalizeDisplaySetting", () => {
  it("maps legacy string and default to arrays", () => {
    expect(normalizeDisplaySetting(undefined)).toEqual([]);
    expect(normalizeDisplaySetting("default")).toEqual([]);
    expect(normalizeDisplaySetting("flat")).toEqual(["flat"]);
    expect(normalizeDisplaySetting(["hide-threatened", "vertex-style"])).toEqual([
      "hide-threatened",
      "vertex-style",
    ]);
  });
});

describe("displaySettingEqual", () => {
  it("treats string and single-element array as equal", () => {
    expect(displaySettingEqual("flat", ["flat"])).toBe(true);
    expect(displaySettingEqual([], undefined)).toBe(true);
  });
});

describe("session display override encoding", () => {
  it("round-trips arrays via JSON", () => {
    const raw = serializeSessionDisplayOverride(["flat"]);
    expect(parseSessionDisplayOverride(raw)).toEqual(["flat"]);
    expect(parseSessionDisplayOverride(null)).toBe(null);
  });

  it("migrates legacy plain string", () => {
    expect(parseSessionDisplayOverride("flat")).toEqual(["flat"]);
  });
});

describe("buildRenderDisplayOpts", () => {
  it("sets altDisplays and legacy altDisplay for one uid", () => {
    const opts = buildRenderDisplayOpts("druid", "flat", { perspective: 1 });
    expect(opts.perspective).toBe(1);
    expect(opts.altDisplays).toEqual(["flat"]);
    expect(opts.altDisplay).toBe("flat");
  });

  it("omits display keys for default", () => {
    const opts = buildRenderDisplayOpts("druid", [], { perspective: 2 });
    expect(opts.altDisplays).toBe(undefined);
    expect(opts.altDisplay).toBe(undefined);
  });
});

describe("modal display mapping", () => {
  it("converts between modal radio and stored arrays", () => {
    expect(displaySettingForModal(["flat"])).toBe("flat");
    expect(displaySettingFromModal("flat")).toEqual(["flat"]);
    expect(displaySettingFromModal("default")).toEqual([]);
  });
});

describe("board display FAB cycle", () => {
  it("allows cycle for single projection group and single checkbox games", () => {
    expect(canCycleBoardDisplay("stigmergy")).toBe(false);
    expect(canCycleBoardDisplay("druid")).toBe(true);
    expect(canCycleBoardDisplay("asli")).toBe(true);
  });

  it("cycles default and flat for druid", () => {
    expect(nextBoardDisplayCycle("druid", [])).toEqual(["flat"]);
    expect(nextBoardDisplayCycle("druid", ["flat"])).toEqual([]);
  });

  it("cycles default and swap-prison for asli", () => {
    expect(nextBoardDisplayCycle("asli", [])).toEqual(["swap-prison"]);
    expect(nextBoardDisplayCycle("asli", ["swap-prison"])).toEqual([]);
  });
});
