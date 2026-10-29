/* eslint-env node */
/**
 * Inventory of hashed assets from a Vite build, used to prune orphaned S3 objects
 * without time-based expiry on the live site (safe if deploys pause for months).
 */
import fs from "fs";
import path from "path";

export const STATIC_INVENTORY_S3_KEY = "_ops/static-inventory.json";

/** Keep previous-release hashes this long after upload (long-lived tabs). */
export const STATIC_PRUNE_GRACE_DAYS = 7;

export const STATIC_PRUNE_PREFIXES = ["static/", "flags/"];

function walkFiles(dir, baseDir, prefix, keys) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      walkFiles(full, baseDir, prefix, keys);
    } else if (name.isFile()) {
      const rel = path.relative(baseDir, full).split(path.sep).join("/");
      keys.push(`${prefix}/${rel}`);
    }
  }
}

/**
 * S3 object keys for fingerprinted assets in this build (posix paths).
 * @param {string} buildDir
 * @returns {string[]}
 */
export function collectBuildAssetKeys(buildDir) {
  const keys = [];
  walkFiles(path.join(buildDir, "static"), path.join(buildDir, "static"), "static", keys);
  walkFiles(path.join(buildDir, "flags"), path.join(buildDir, "flags"), "flags", keys);
  return keys.sort();
}

/**
 * @param {string[]} keys
 * @param {string} [generatedAt] ISO timestamp
 */
export function buildStaticInventoryDocument(keys, generatedAt = new Date().toISOString()) {
  return {
    version: 1,
    generatedAt,
    keys: [...keys].sort(),
  };
}

/**
 * @param {object} params
 * @param {string} params.key S3 object key
 * @param {number} params.lastModifiedMs
 * @param {ReadonlySet<string>} params.activeKeys from current inventory
 * @param {number} params.nowMs
 * @param {number} [params.graceDays]
 */
export function shouldPruneStaticObject({
  key,
  lastModifiedMs,
  activeKeys,
  nowMs,
  graceDays = STATIC_PRUNE_GRACE_DAYS,
}) {
  if (!STATIC_PRUNE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return false;
  }
  if (activeKeys.has(key)) {
    return false;
  }
  const graceMs = graceDays * 86_400_000;
  return lastModifiedMs < nowMs - graceMs;
}
