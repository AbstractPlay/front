import { describe, expect, it } from "vitest";
import {
  PLAY_SITE_ORIGIN,
  canonicalPlayUrl,
  canonicalPlayUrlFromLocation,
  normalizePlayPathname,
  shouldNormalizeTournamentDetailUrl,
  tournamentDetailPath,
} from "./seoCanonical";

describe("normalizePlayPathname", () => {
  it("defaults empty to root", () => {
    expect(normalizePlayPathname("")).toBe("/");
    expect(normalizePlayPathname(undefined)).toBe("/");
  });

  it("adds leading slash and removes trailing slash", () => {
    expect(normalizePlayPathname("games/go")).toBe("/games/go");
    expect(normalizePlayPathname("/explore/all/")).toBe("/explore/all");
  });

  it("keeps root as slash only", () => {
    expect(normalizePlayPathname("/")).toBe("/");
  });
});

describe("canonicalPlayUrl", () => {
  it("uses play origin and normalized path", () => {
    expect(canonicalPlayUrl("/games/go")).toBe(
      `${PLAY_SITE_ORIGIN}/games/go`
    );
    expect(canonicalPlayUrl("stats/site")).toBe(
      `${PLAY_SITE_ORIGIN}/stats/site`
    );
  });
});

describe("canonicalPlayUrlFromLocation", () => {
  it("strips move exploration query params", () => {
    expect(
      canonicalPlayUrlFromLocation(
        "/move/go/1/abc",
        "?move=9&nodeid=foo"
      )
    ).toBe(`${PLAY_SITE_ORIGIN}/move/go/1/abc`);
  });

  it("keeps unrelated query params", () => {
    expect(
      canonicalPlayUrlFromLocation("/tournament/x", "?gameId=a&metaGame=go")
    ).toBe(`${PLAY_SITE_ORIGIN}/tournament/x?gameId=a&metaGame=go`);
  });
});

describe("tournamentDetailPath", () => {
  it("uses id-only path", () => {
    expect(tournamentDetailPath("09fe1afc-7c15-4ac2-a57b-cadfc100511d")).toBe(
      "/tournament/09fe1afc-7c15-4ac2-a57b-cadfc100511d"
    );
  });
});

describe("shouldNormalizeTournamentDetailUrl", () => {
  const id = "09fe1afc-7c15-4ac2-a57b-cadfc100511d";

  it("normalizes meta/id path", () => {
    expect(
      shouldNormalizeTournamentDetailUrl(
        `/tournament/go/${id}`,
        "",
        id
      )
    ).toBe(true);
  });

  it("accepts canonical path without search", () => {
    expect(
      shouldNormalizeTournamentDetailUrl(`/tournament/${id}`, "", id)
    ).toBe(false);
  });

  it("strips fix-up query params", () => {
    expect(
      shouldNormalizeTournamentDetailUrl(
        `/tournament/${id}`,
        "?gameId=a&metaGame=go",
        id
      )
    ).toBe(true);
  });
});
