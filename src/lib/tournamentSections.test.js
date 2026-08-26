import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOURNAMENT_TAB,
  isValidTournamentTab,
  resolveTournamentRouteParams,
  tournamentListPath,
} from "./tournamentSections";

describe("tournamentListPath", () => {
  it("builds tab-only paths", () => {
    expect(tournamentListPath("open")).toBe("/tournaments/open");
    expect(tournamentListPath("completed")).toBe("/tournaments/completed");
  });

  it("appends a valid game filter", () => {
    expect(tournamentListPath("open", "go")).toBe("/tournaments/open/go");
  });

  it("ignores invalid game filters", () => {
    expect(tournamentListPath("open", "not-a-game")).toBe("/tournaments/open");
  });
});

describe("resolveTournamentRouteParams", () => {
  it("redirects bare /tournaments to stored tab", () => {
    const resolved = resolveTournamentRouteParams(undefined, undefined, "current");
    expect(resolved.tab).toBe("current");
    expect(resolved.metaGame).toBeNull();
    expect(resolved.redirectTo).toBe("/tournaments/current");
  });

  it("accepts tab and optional game filter", () => {
    const resolved = resolveTournamentRouteParams("completed", "go", "open");
    expect(resolved.tab).toBe("completed");
    expect(resolved.metaGame).toBe("go");
    expect(resolved.redirectTo).toBeNull();
  });

  it("redirects legacy /tournaments/:gameUid paths", () => {
    const resolved = resolveTournamentRouteParams("go", undefined, "open");
    expect(resolved.tab).toBe("open");
    expect(resolved.metaGame).toBe("go");
    expect(resolved.redirectTo).toBe("/tournaments/open/go");
  });

  it("redirects invalid tabs to default", () => {
    const resolved = resolveTournamentRouteParams("nope", undefined, "open");
    expect(resolved.tab).toBe(DEFAULT_TOURNAMENT_TAB);
    expect(resolved.redirectTo).toBe("/tournaments/open");
  });

  it("validates tab ids", () => {
    expect(isValidTournamentTab("open")).toBe(true);
    expect(isValidTournamentTab("propose")).toBe(false);
    expect(isValidTournamentTab("go")).toBe(false);
  });
});
