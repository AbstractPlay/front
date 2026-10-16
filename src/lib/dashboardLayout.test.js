import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  dashboardTabAvailability,
  firstEnabledDashboardTab,
  normalizeDashboardTab,
  DASHBOARD_TAB_ADMIN,
  DASHBOARD_TAB_CHALLENGES,
  DASHBOARD_TAB_GAMES,
  DASHBOARD_TAB_TOURNAMENTS,
} from "./dashboardLayout.js";

describe("dashboardTabAvailability", () => {
  it("always enables the games tab", () => {
    const a = dashboardTabAvailability({
      myMove: [],
      waiting: [],
      watchedGames: [],
      currentTournaments: [],
      challengesReceived: [],
      challengesAwaitingResponse: false,
      openStandingChallenges: [],
      realStanding: [],
      isAdmin: false,
    });
    assert.equal(a[DASHBOARD_TAB_GAMES], true);
    assert.equal(a[DASHBOARD_TAB_TOURNAMENTS], false);
  });

  it("enables challenges when standing entries exist", () => {
    const a = dashboardTabAvailability({
      myMove: [],
      waiting: [],
      watchedGames: [],
      currentTournaments: [],
      challengesReceived: [],
      challengesAwaitingResponse: false,
      openStandingChallenges: [],
      realStanding: [{ id: "s1" }],
      isAdmin: false,
    });
    assert.equal(a[DASHBOARD_TAB_CHALLENGES], true);
    assert.equal(a[DASHBOARD_TAB_GAMES], true);
  });
});

describe("admin tab", () => {
  it("is enabled only for admins", () => {
    const admin = dashboardTabAvailability({
      myMove: [],
      waiting: [],
      watchedGames: [],
      currentTournaments: [],
      challengesReceived: [],
      challengesAwaitingResponse: false,
      openStandingChallenges: [],
      realStanding: [],
      isAdmin: true,
    });
    assert.equal(admin[DASHBOARD_TAB_ADMIN], true);
  });
});

describe("normalizeDashboardTab", () => {
  it("falls back when active tab is disabled", () => {
    const availability = {
      [DASHBOARD_TAB_GAMES]: false,
      [DASHBOARD_TAB_TOURNAMENTS]: true,
      [DASHBOARD_TAB_CHALLENGES]: false,
    };
    assert.equal(
      normalizeDashboardTab(DASHBOARD_TAB_GAMES, availability),
      DASHBOARD_TAB_TOURNAMENTS
    );
    assert.equal(
      firstEnabledDashboardTab(availability),
      DASHBOARD_TAB_TOURNAMENTS
    );
  });
});
