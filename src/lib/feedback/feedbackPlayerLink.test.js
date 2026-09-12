import { describe, expect, it } from "vitest";
import { playerIdFromProfileHref } from "./feedbackPlayerLink";

describe("playerIdFromProfileHref", () => {
  const userId = "31af49bc-2030-4adb-aec9-dc8fa418fec1";

  it("parses relative player profile paths", () => {
    expect(playerIdFromProfileHref(`/player/${userId}`)).toBe(userId);
    expect(playerIdFromProfileHref(`/player/${userId}#stats`)).toBe(userId);
  });

  it("parses absolute player profile URLs", () => {
    expect(playerIdFromProfileHref(`https://play.abstractplay.com/player/${userId}`)).toBe(userId);
  });

  it("returns null for non-profile links", () => {
    expect(playerIdFromProfileHref("https://example.com/player/foo")).toBeNull();
    expect(playerIdFromProfileHref("/feedback/bugs")).toBeNull();
    expect(playerIdFromProfileHref(null)).toBeNull();
  });
});
