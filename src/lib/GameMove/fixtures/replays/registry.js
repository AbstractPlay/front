/**
 * Slugs available for local replay (?replay=slug) and Vitest.
 * Browser loads JSON via dynamic import — only from dev replay code paths.
 */
export const GAMEMOVE_REPLAY_SLUGS = ["hex-b058"];

/** @param {string} slug */
export function isRegisteredReplaySlug(slug) {
  return GAMEMOVE_REPLAY_SLUGS.includes(slug);
}

/** @param {string} slug */
export async function importReplayBundleBySlug(slug) {
  if (!isRegisteredReplaySlug(slug)) {
    throw new Error(`Unknown replay slug: ${slug}`);
  }
  switch (slug) {
    case "hex-b058":
      return import("./hex-b058.json");
    default:
      throw new Error(`Unknown replay slug: ${slug}`);
  }
}
