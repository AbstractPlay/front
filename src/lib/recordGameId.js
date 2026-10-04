import { orderVariantUidsForDisplay } from "./expandVariants";
import { getChallengeVariantDefs } from "./variantChallengeValidation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @returns {{ instanceId: string, metaGame: string, variantUids: string[], legacy: boolean } | undefined} */
export function parseRecordGameId(gameid) {
  if (!gameid) {
    return undefined;
  }

  const colonIdx = gameid.indexOf(":");
  if (colonIdx !== -1) {
    const prefix = gameid.slice(0, colonIdx);
    const hashIdx = prefix.indexOf("#");
    if (hashIdx === -1) {
      return undefined;
    }
    const instanceId = prefix.slice(0, hashIdx);
    const metaGame = prefix.slice(hashIdx + 1);
    if (!UUID_RE.test(instanceId) || metaGame.length === 0) {
      return undefined;
    }
    const variantPart = gameid.slice(colonIdx + 1);
    const variantUids =
      variantPart.length === 0
        ? []
        : variantPart.split("|").filter((v) => v.length > 0);
    return {
      instanceId,
      metaGame,
      variantUids: orderVariantUidsForDisplay(metaGame, variantUids),
      legacy: false,
    };
  }

  const hashIdx = gameid.indexOf("#");
  if (hashIdx === -1) {
    return undefined;
  }
  const metaGame = gameid.slice(0, hashIdx);
  const instanceId = gameid.slice(hashIdx + 1);
  if (metaGame.length === 0 || !UUID_RE.test(instanceId)) {
    return undefined;
  }
  return {
    instanceId,
    metaGame,
    variantUids: [],
    legacy: true,
  };
}

/**
 * Map human-readable variant labels from exported records to challenge UIDs.
 *
 * @param {string} metaGame
 * @param {unknown} labels
 * @returns {string[]}
 */
export function mapRecordVariantLabelsToUids(metaGame, labels) {
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }
  const defs = getChallengeVariantDefs(metaGame);
  if (defs.length === 0) {
    return [];
  }
  const uidSet = new Set(defs.map((d) => d.uid));
  const nameToUid = new Map();
  for (const def of defs) {
    if (def.name) {
      nameToUid.set(def.name.trim().toLowerCase(), def.uid);
    }
    nameToUid.set(def.uid.toLowerCase(), def.uid);
  }
  const out = [];
  for (const label of labels) {
    if (typeof label !== "string") {
      continue;
    }
    const trimmed = label.trim();
    if (!trimmed) {
      continue;
    }
    if (uidSet.has(trimmed) && !trimmed.startsWith("#")) {
      out.push(trimmed);
      continue;
    }
    const uid = nameToUid.get(trimmed.toLowerCase());
    if (uid && !uid.startsWith("#")) {
      out.push(uid);
    }
  }
  return out;
}

/**
 * Variant UIDs for a player record row (History / rematch).
 * Prefers variant codes from encoded `header.site.gameid` (`uuid#meta:uid|…`);
 * `header.game.variants` is display copy and is only used for legacy gameids.
 *
 * @param {unknown} rec
 * @param {string | null | undefined} metaGame
 * @returns {string[]}
 */
export function variantUidsFromPlayerRecord(rec, metaGame) {
  if (!metaGame) {
    return [];
  }
  const gameid = rec?.header?.site?.gameid;
  if (typeof gameid === "string") {
    const parsed = parseRecordGameId(gameid);
    if (parsed && !parsed.legacy) {
      return orderVariantUidsForDisplay(metaGame, [...parsed.variantUids]);
    }
  }
  const headerVariants = rec?.header?.game?.variants;
  const fromHeader = mapRecordVariantLabelsToUids(metaGame, headerVariants);
  if (fromHeader.length > 0) {
    return orderVariantUidsForDisplay(metaGame, fromHeader);
  }
  return [];
}
