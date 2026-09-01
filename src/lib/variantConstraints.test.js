import { describe, expect, it } from "vitest";
import {
  evaluateAvailability,
  gameinfo,
  sanitizeVariantSelection,
  validateVariantSelection,
} from "@abstractplay/gameslib";
import {
  getChallengeVariantDefs,
  validateChallengeVariantSelection,
} from "./variantChallengeValidation";

const loaVariants = [
  { uid: "classic", group: "board", default: true },
  { uid: "#board" },
  { uid: "hex5", group: "board" },
  { uid: "hex6", group: "board" },
  {
    uid: "scrambled",
    group: "setup",
    enabledWhen: { board: ["#board", "classic"] },
  },
];

describe("variantConstraints (gameslib)", () => {
  it("sanitize drops scrambled when hex5 is active", () => {
    expect(sanitizeVariantSelection(loaVariants, ["hex5", "scrambled"])).toEqual(
      ["hex5"],
    );
  });

  it("evaluateAvailability disables scrambled under hex5", () => {
    const map = evaluateAvailability(loaVariants, ["hex5"]);
    expect(map.get("scrambled")?.selectable).toBe(false);
  });

  it("validateVariantSelection rejects hex5 + scrambled", () => {
    const result = validateVariantSelection(loaVariants, ["hex5", "scrambled"]);
    expect(result.ok).toBe(false);
  });
});

describe("variantChallengeValidation", () => {
  it("loads challenge variant defs with constraint metadata for loa", () => {
    if (!gameinfo.has("loa")) {
      return;
    }
    const defs = getChallengeVariantDefs("loa");
    const scrambled = defs.find((v) => v.uid === "scrambled");
    expect(scrambled?.enabledWhen?.board).toContain("classic");
  });

  it("rejects invalid loa challenge selection", () => {
    if (!gameinfo.has("loa")) {
      return;
    }
    expect(validateChallengeVariantSelection("loa", ["hex5", "scrambled"]).ok).toBe(
      false,
    );
  });
});
