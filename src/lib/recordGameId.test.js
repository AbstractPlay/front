import { describe, expect, it } from "vitest";
import { parseRecordGameId, variantUidsFromPlayerRecord } from "./recordGameId";

const INSTANCE_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

describe("parseRecordGameId", () => {
  it("parses current encoded gameids with variant codes", () => {
    expect(parseRecordGameId(`${INSTANCE_ID}#go:9x9|handicap`)).toEqual({
      instanceId: INSTANCE_ID,
      metaGame: "go",
      variantUids: ["9x9", "handicap"],
      legacy: false,
    });
  });

  it("parses encoded gameids with trailing colon and no variants", () => {
    expect(parseRecordGameId(`${INSTANCE_ID}#chess:`)).toEqual({
      instanceId: INSTANCE_ID,
      metaGame: "chess",
      variantUids: [],
      legacy: false,
    });
  });

  it("parses legacy meta-first gameids", () => {
    expect(parseRecordGameId(`go#${INSTANCE_ID}`)).toEqual({
      instanceId: INSTANCE_ID,
      metaGame: "go",
      variantUids: [],
      legacy: true,
    });
  });

  it("returns undefined for empty or unparseable gameids", () => {
    expect(parseRecordGameId("")).toBeUndefined();
    expect(parseRecordGameId("solo-graded-1")).toBeUndefined();
    expect(parseRecordGameId(undefined)).toBeUndefined();
  });
});

describe("variantUidsFromPlayerRecord", () => {
  it("prefers encoded gameid over display names in header", () => {
    const rec = {
      header: {
        game: {
          variants: ["Default game length (39 tiles)", "Ex Nihilo"],
        },
        site: { gameid: `${INSTANCE_ID}#exxit:exNihilo` },
      },
    };
    expect(variantUidsFromPlayerRecord(rec, "exxit")).toEqual(["exNihilo"]);
  });

  it("returns empty uids for encoded gameid with default-only variants", () => {
    const rec = {
      header: {
        game: {
          variants: ["Default game length (39 tiles)", "Default setup"],
        },
        site: { gameid: `${INSTANCE_ID}#exxit:` },
      },
    };
    expect(variantUidsFromPlayerRecord(rec, "exxit")).toEqual([]);
  });

  it("falls back to encoded gameid when header variants missing", () => {
    const rec = {
      header: {
        game: {},
        site: { gameid: `${INSTANCE_ID}#go:9x9|handicap` },
      },
    };
    expect(variantUidsFromPlayerRecord(rec, "go")).toEqual(["9x9", "handicap"]);
  });

  it("returns empty when no variants and legacy gameid", () => {
    const rec = {
      header: {
        game: {},
        site: { gameid: `go#${INSTANCE_ID}` },
      },
    };
    expect(variantUidsFromPlayerRecord(rec, "go")).toEqual([]);
  });

  it("returns empty without metaGame", () => {
    expect(variantUidsFromPlayerRecord({ header: {} }, null)).toEqual([]);
  });
});
