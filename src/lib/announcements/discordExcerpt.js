/** Must match node-backend `lib/announcements/discordExcerpt.ts`. */
export const DISCORD_EXCERPT_END_MARKER = "<!--ap:discord-excerpt-end-->";

const MARKER_RE = /<!--\s*ap:discord-excerpt-end\s*-->/i;

/** Remove excerpt marker from markdown shown on /news (marker only; keeps text after it). */
export function removeDiscordExcerptMarker(body) {
  if (!body) {
    return body;
  }
  return body.replace(MARKER_RE, "");
}
