import { describe, expect, it } from "vitest";
import {
  canonicalGamePlayPath,
  canonicalGamePlayPathForActiveRow,
  canonicalGamePlayPathFromRecordSite,
} from "./gamePlayLinks.js";

describe("canonicalGamePlayPath", () => {
  it("uses arena play path for arena rows", () => {
    expect(
      canonicalGamePlayPath({
        metaGame: "abande",
        id: "table-uuid",
        playMode: "arena",
      }),
    ).toBe("/arena/play/abande/table-uuid");
  });

  it("uses move path for correspondence", () => {
    expect(
      canonicalGamePlayPath({ metaGame: "go", id: "g1" }, { cbit: 0 }),
    ).toBe("/move/go/0/g1");
    expect(
      canonicalGamePlayPath({ metaGame: "go", id: "g1" }, { cbit: 1 }),
    ).toBe("/move/go/1/g1");
  });

  it("reads playMode from archived record site", () => {
    expect(
      canonicalGamePlayPathFromRecordSite(
        { playMode: "arena", gameid: "x" },
        "abande",
        "tid",
      ),
    ).toBe("/arena/play/abande/tid");
  });

  it("picks cbit for active dashboard rows", () => {
    expect(
      canonicalGamePlayPathForActiveRow({
        metaGame: "go",
        id: "g1",
        toMove: "u1",
      }),
    ).toBe("/move/go/0/g1");
    expect(
      canonicalGamePlayPathForActiveRow({
        metaGame: "abande",
        id: "tid",
        playMode: "arena",
        toMove: "",
      }),
    ).toBe("/arena/play/abande/tid");
  });
});
