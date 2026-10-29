import { describe, expect, it } from "vitest";
import { applyArenaSiteFieldsToGameRecord } from "./arenaGameRecord.js";

describe("applyArenaSiteFieldsToGameRecord", () => {
  it("stamps header.site for arena games", () => {
    const rec = {
      header: {
        site: { name: "Abstract Play", gameid: "gid" },
      },
    };
    applyArenaSiteFieldsToGameRecord(rec, {
      playMode: "arena",
      arenaTcId: "blitz_5_3",
      arenaClock: { startSec: 300, incSec: 3, maxSec: 300 },
    });
    expect(rec.header.site.playMode).toBe("arena");
    expect(rec.header.site.arenaTcId).toBe("blitz_5_3");
    expect(rec.header.site.arenaClock).toEqual({
      startSec: 300,
      incSec: 3,
      maxSec: 300,
    });
  });

  it("leaves correspondence records unchanged", () => {
    const rec = {
      header: { site: { name: "Abstract Play", gameid: "gid" } },
    };
    applyArenaSiteFieldsToGameRecord(rec, { playMode: "correspondence" });
    expect(rec.header.site.playMode).toBeUndefined();
  });
});
