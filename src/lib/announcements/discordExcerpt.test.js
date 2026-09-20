import { describe, expect, it } from "vitest";
import {
  DISCORD_EXCERPT_END_MARKER,
  removeDiscordExcerptMarker,
} from "./discordExcerpt";

describe("removeDiscordExcerptMarker", () => {
  it("removes marker and keeps following content", () => {
    const body = `Teaser line.\n${DISCORD_EXCERPT_END_MARKER}\n## Rest`;
    expect(removeDiscordExcerptMarker(body)).toBe("Teaser line.\n\n## Rest");
  });

  it("leaves body unchanged when marker absent", () => {
    const body = "Hello **world**";
    expect(removeDiscordExcerptMarker(body)).toBe(body);
  });
});
