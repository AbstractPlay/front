import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOURNAMENT_TAB,
  isEmbeddedTournamentsPath,
  isValidTournamentTab,
  resolveTournamentRouteContext,
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

describe("resolveTournamentRouteContext", () => {
  it("keeps game detail tournaments embedded without redirecting", () => {
    const resolved = resolveTournamentRouteContext({
      pathname: "/games/go",
      tabParam: undefined,
      metaGameParam: "go",
      storedTab: "current",
    });
    expect(resolved).toEqual({
      tab: "current",
      metaGame: "go",
      redirectTo: null,
      embedded: true,
    });
  });

  it("delegates standalone tournament routes to route param resolution", () => {
    const resolved = resolveTournamentRouteContext({
      pathname: "/tournaments/open/go",
      tabParam: "open",
      metaGameParam: "go",
      storedTab: "current",
    });
    expect(resolved.tab).toBe("open");
    expect(resolved.metaGame).toBe("go");
    expect(resolved.redirectTo).toBeNull();
    expect(resolved.embedded).toBe(false);
  });
});

describe("isEmbeddedTournamentsPath", () => {
  it("detects game detail paths only", () => {
    expect(isEmbeddedTournamentsPath("/games/go")).toBe(true);
    expect(isEmbeddedTournamentsPath("/games")).toBe(false);
    expect(isEmbeddedTournamentsPath("/tournaments/open/go")).toBe(false);
  });
});
