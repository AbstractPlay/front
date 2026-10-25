import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import { isLabSupportedGame } from "./buildGame";
import {
  buildFreshPlaygroundSession,
  buildPlaygroundLaunchPath,
  defaultPlaygroundVariantUids,
  playgroundNeedsLauncherSetup,
  playgroundVariantCatalog,
} from "./playgroundLaunch";

function findLabMetaMatching(predicate) {
  for (const [uid] of gameinfo) {
    if (!isLabSupportedGame(uid)) {
      continue;
    }
    if (predicate(uid)) {
      return uid;
    }
  }
  return undefined;
}

describe("playgroundLaunch", () => {
  it("buildPlaygroundLaunchPath encodes metaGame query", () => {
    expect(buildPlaygroundLaunchPath("go")).toBe("/playground?metaGame=go");
  });

  it("playgroundNeedsLauncherSetup is true when multiple player counts exist", () => {
    const uid = findLabMetaMatching(
      (id) => gameinfo.get(id).playercounts.length > 1,
    );
    expect(uid).toBeDefined();
    expect(playgroundNeedsLauncherSetup(uid)).toBe(true);
  });

  it("playgroundNeedsLauncherSetup is false for single-count games without variant UI", () => {
    const uid = findLabMetaMatching((id) => {
      const info = gameinfo.get(id);
      if (info.playercounts.length !== 1) {
        return false;
      }
      const { groupData, nonGroupData } = playgroundVariantCatalog(id);
      return groupData.length === 0 && nonGroupData.length === 0;
    });
    expect(uid).toBeDefined();
    expect(playgroundNeedsLauncherSetup(uid)).toBe(false);
  });

  it("playgroundNeedsLauncherSetup is true when variant UI would render", () => {
    const uid = findLabMetaMatching((id) => {
      const info = gameinfo.get(id);
      if (info.playercounts.length !== 1) {
        return false;
      }
      const { groupData, nonGroupData } = playgroundVariantCatalog(id);
      return groupData.length > 0 || nonGroupData.length > 0;
    });
    expect(uid).toBeDefined();
    expect(playgroundNeedsLauncherSetup(uid)).toBe(true);
  });

  it("buildFreshPlaygroundSession returns a lab game for minimal catalog entries", () => {
    const uid = findLabMetaMatching(
      (id) => !playgroundNeedsLauncherSetup(id),
    );
    expect(uid).toBeDefined();
    const session = buildFreshPlaygroundSession(uid);
    expect(session.game.metaGame).toBe(uid);
    expect(session.savedExploration).toBeNull();
    expect(session.sessionName.length).toBeGreaterThan(0);
    expect(defaultPlaygroundVariantUids(uid)).toEqual([]);
  });
});
