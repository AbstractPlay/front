export const THUMBNAIL_CDN_ORIGIN = "https://thumbnails.abstractplay.com";
export const THUMBNAIL_ARTIFACT_VERSION = 1;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThumbnailSourceMeta(value) {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.metaGame === "string" &&
    typeof value.gameId === "string" &&
    (value.cbit === "0" || value.cbit === "1") &&
    (value.sampleKind === "active" || value.sampleKind === "completed") &&
    typeof value.generatedAt === "string" &&
    typeof value.moveUrl === "string"
  );
}

export function thumbnailJsonUrl(metaGame) {
  return `${THUMBNAIL_CDN_ORIGIN}/${metaGame}.json`;
}

/**
 * Unwrap v1 envelope or return legacy bare render rep.
 * @returns {{ render: unknown, source: object | null }}
 */
export function parseThumbnailJson(parsed) {
  let data = parsed;
  if (typeof data === "string") {
    data = JSON.parse(data);
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
  }
  if (!isRecord(data)) {
    throw new Error("Thumbnail JSON is not an object");
  }
  if (
    data.v === THUMBNAIL_ARTIFACT_VERSION &&
    isThumbnailSourceMeta(data.source) &&
    data.render !== undefined
  ) {
    return { render: data.render, source: data.source };
  }
  return { render: data, source: null };
}

/** @param {string} metaGame */
export async function fetchThumbnailSource(metaGame) {
  try {
    const res = await fetch(thumbnailJsonUrl(metaGame));
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const { source } = parseThumbnailJson(data);
    return source;
  } catch {
    return null;
  }
}
