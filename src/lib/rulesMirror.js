/** Public rules PDF mirrors — https://rules.abstractplay.com */

export const RULES_MIRROR_CDN_BASE = "https://rules.abstractplay.com";
export const RULES_MIRROR_MANIFEST_URL = `${RULES_MIRROR_CDN_BASE}/rules-mirrors.json`;

let manifestCache = null;
let manifestPromise = null;

/**
 * @returns {Promise<Record<string, { status?: string }>>}
 */
export async function fetchRulesMirrorManifest() {
  if (manifestCache) {
    return manifestCache;
  }
  if (!manifestPromise) {
    manifestPromise = fetch(RULES_MIRROR_MANIFEST_URL, { credentials: "omit" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`manifest HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        manifestCache = data && typeof data === "object" ? data : {};
        return manifestCache;
      })
      .catch(() => {
        manifestCache = {};
        return manifestCache;
      });
  }
  return manifestPromise;
}

export function rulesMirrorPdfUrl(uid) {
  return `${RULES_MIRROR_CDN_BASE}/${uid}.pdf`;
}

export function rulesMirrorOk(manifest, uid) {
  return manifest?.[uid]?.status === "ok";
}
