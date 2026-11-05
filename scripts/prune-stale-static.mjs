/* eslint-env node */
/**
 * Remove orphaned `static/` and `flags/` objects not in the latest deploy inventory.
 * Does not use S3 lifecycle expiration (which would delete current assets after N days
 * even when deploys stop). Run after each static deploy.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import {
  STATIC_INVENTORY_S3_KEY,
  STATIC_PRUNE_GRACE_DAYS,
  STATIC_PRUNE_PREFIXES,
  shouldPruneStaticObject,
} from "./staticDeployInventory.mjs";

const AWS_REGION = "us-east-1";

/** Default spawn buffer (1 MiB) is too small for full S3 list-objects JSON on busy dev buckets. */
const AWS_EXEC_MAX_BUFFER = 64 * 1024 * 1024;

/** Paginate listings; slim --query keeps each page well under maxBuffer. */
export const LIST_OBJECTS_MAX_KEYS = 500;

/** Only fields prune logic needs; preserves pagination metadata. */
export const LIST_OBJECTS_QUERY =
  "{Contents: Contents[].{Key: Key, LastModified: LastModified}, IsTruncated: IsTruncated, NextContinuationToken: NextContinuationToken}";

const STAGE_CONFIG = {
  dev: {
    bucket: "abstract-play-dev",
    profile: "AbstractPlayDev",
  },
  prod: {
    bucket: "abstract-play-prod",
    profile: "AbstractPlayProd",
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const stageIdx = args.indexOf("--stage");
  const stage = stageIdx >= 0 ? args[stageIdx + 1] : "dev";
  if (!STAGE_CONFIG[stage]) {
    console.error(`Unknown stage "${stage}". Use --stage dev|prod`);
    process.exit(1);
  }
  return { stage, config: STAGE_CONFIG[stage], dryRun: args.includes("--dry-run") };
}

function awsProfileArgs(config) {
  return ["--profile", config.profile, "--region", AWS_REGION];
}

function awsJson(args, config) {
  const output = execFileSync(
    "aws",
    [...args, ...awsProfileArgs(config)],
    { encoding: "utf8", maxBuffer: AWS_EXEC_MAX_BUFFER },
  );
  return JSON.parse(output);
}

export function buildListObjectsV2Args(config, prefix, continuationToken) {
  const args = [
    "s3api",
    "list-objects-v2",
    "--bucket",
    config.bucket,
    "--prefix",
    prefix,
    "--max-keys",
    String(LIST_OBJECTS_MAX_KEYS),
    "--output",
    "json",
    "--query",
    LIST_OBJECTS_QUERY,
  ];
  if (continuationToken) {
    args.push("--continuation-token", continuationToken);
  }
  return args;
}

export function objectsFromListPage(page) {
  const out = [];
  for (const item of page.Contents ?? []) {
    if (item.Key) {
      out.push({ key: item.Key, lastModifiedMs: new Date(item.LastModified).getTime() });
    }
  }
  return out;
}

function loadInventory(config) {
  const tmp = path.join(tmpdir(), `ap-static-inventory-${Date.now()}.json`);
  try {
    execFileSync(
      "aws",
      [
        "s3",
        "cp",
        `s3://${config.bucket}/${STATIC_INVENTORY_S3_KEY}`,
        tmp,
        ...awsProfileArgs(config),
      ],
      { stdio: "pipe", maxBuffer: AWS_EXEC_MAX_BUFFER },
    );
    const doc = JSON.parse(fs.readFileSync(tmp, "utf8"));
    if (!Array.isArray(doc.keys)) {
      throw new Error("inventory.keys must be an array");
    }
    return doc;
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
}

function listPrefix(config, prefix) {
  const keys = [];
  let token;
  do {
    const page = awsJson(buildListObjectsV2Args(config, prefix, token), config);
    keys.push(...objectsFromListPage(page));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

export function planPruneActions(inventory, objects, nowMs, graceDays = STATIC_PRUNE_GRACE_DAYS) {
  const activeKeys = new Set(inventory.keys);
  const toDelete = [];
  for (const obj of objects) {
    if (
      shouldPruneStaticObject({
        key: obj.key,
        lastModifiedMs: obj.lastModifiedMs,
        activeKeys,
        nowMs,
        graceDays,
      })
    ) {
      toDelete.push(obj.key);
    }
  }
  return toDelete.sort();
}

function main() {
  const { config, dryRun } = parseArgs();
  let inventory;
  try {
    inventory = loadInventory(config);
  } catch (err) {
    console.warn(
      `Skipping prune: could not load s3://${config.bucket}/${STATIC_INVENTORY_S3_KEY} (${err.message})`,
    );
    return;
  }

  const nowMs = Date.now();
  const objects = STATIC_PRUNE_PREFIXES.flatMap((prefix) => listPrefix(config, prefix));
  const toDelete = planPruneActions(inventory, objects, nowMs);

  if (toDelete.length === 0) {
    console.log("No orphaned static assets to prune.");
    return;
  }

  console.log(
    `${dryRun ? "[dry-run] Would delete" : "Deleting"} ${toDelete.length} orphaned object(s) (grace ${STATIC_PRUNE_GRACE_DAYS}d, not in current inventory)`,
  );
  for (const key of toDelete) {
    console.log(`  ${key}`);
    if (!dryRun) {
      execFileSync(
        "aws",
        [
          "s3api",
          "delete-object",
          "--bucket",
          config.bucket,
          "--key",
          key,
          ...awsProfileArgs(config),
        ],
        { stdio: "pipe", maxBuffer: AWS_EXEC_MAX_BUFFER },
      );
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
