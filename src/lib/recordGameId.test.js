import { describe, expect, it } from "vitest";
import { parseRecordGameId } from "./recordGameId";

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
