import { describe, expect, it, beforeAll } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import { expandVariants } from "./expandVariants";
import {
  formatSummaryGameKey,
  formatVariantUids,
  matchesSummaryGameKey,
  metaUidFromSummaryGameKey,
  parseSummaryGameKey,
} from "./summaryGameKeys";
import { getGameDisplayName } from "./gameOptions";
import { setupGameslibI18nForTests } from "./testGameslibI18n";

beforeAll(() => setupGameslibI18nForTests());

function sampleMeta() {
  const entry = [...gameinfo.entries()][0];
  expect(entry).toBeDefined();
  return { uid: entry[0], info: entry[1] };
}

describe("formatVariantUids", () => {
  it("resolves engine variant labels", () => {
    expect(formatVariantUids("archimedes", ["8x10"])).toBe("8x10 board");
    expect(expandVariants("archimedes", ["8x10"])).toContain("8x10 board");
  });

  it("resolves abande board variant UIDs to localized labels", () => {
    expect(formatVariantUids("abande", ["hex"])).toBe("Board: Hexagonal");
    expect(formatVariantUids("abande", ["snub"])).toBe("Board: Snub Square");
    expect(formatVariantUids("abande", ["libre"])).toBe("Abande Libre");
  });
});

describe("parseSummaryGameKey", () => {
  it("parses uid-only keys", () => {
    const { uid } = sampleMeta();
    expect(parseSummaryGameKey(uid)).toEqual({
      metaUid: uid,
      variantUids: [],
    });
  });

  it("parses uid variant keys", () => {
    expect(parseSummaryGameKey("go (9x9|handicap)")).toEqual({
      metaUid: "go",
      variantUids: ["9x9", "handicap"],
    });
  });

  it("parses legacy display-name keys", () => {
    const { uid, info } = sampleMeta();
    expect(parseSummaryGameKey(`${info.name} (no variants)`)).toEqual({
      metaUid: uid,
      variantUids: [],
    });
  });
});

describe("matchesSummaryGameKey", () => {
  it("matches by meta uid", () => {
    const { uid } = sampleMeta();
    expect(matchesSummaryGameKey(`${uid} (9x9)`, uid)).toBe(true);
    expect(matchesSummaryGameKey(`${uid} (9x9)`, "not-a-real-meta-game")).toBe(
      false
    );
  });

  it("matches legacy filters by display name", () => {
    const { uid, info } = sampleMeta();
    expect(matchesSummaryGameKey(`${info.name} (9x9)`, info.name)).toBe(true);
    expect(matchesSummaryGameKey(`${info.name} (no variants)`, info.name)).toBe(
      true
    );
    expect(matchesSummaryGameKey(`${uid} (no variants)`, uid)).toBe(true);
  });
});

describe("formatSummaryGameKey", () => {
  it("formats uid keys to display names", () => {
    const { uid } = sampleMeta();
    expect(formatSummaryGameKey(uid)).toBe(getGameDisplayName(uid));
    expect(formatSummaryGameKey(`${uid} (no variants)`, (k) => k)).toContain(
      getGameDisplayName(uid)
    );
  });
});

describe("metaUidFromSummaryGameKey", () => {
  it("returns uid from rating keys", () => {
    expect(metaUidFromSummaryGameKey("go (9x9|handicap)")).toBe("go");
  });
});
