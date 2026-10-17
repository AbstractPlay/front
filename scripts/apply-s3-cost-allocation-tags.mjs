/* eslint-env node */
/**
 * Merge ap:service / ap:stage onto the play S3 bucket without dropping existing
 * tags (serverless-finch putBucketTagging replaces the full set and fails when
 * AWS system tags would be removed).
 */
import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { apCostAllocationTagItems } from "./apCostAllocationTags.mjs";

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

export function mergeCostAllocationTags(existingTagSet, stage) {
  const map = new Map();
  for (const t of existingTagSet) {
    if (t?.Key != null && t.Value != null) {
      map.set(t.Key, t.Value);
    }
  }
  for (const t of apCostAllocationTagItems(stage)) {
    map.set(t.Key, t.Value);
  }
  return [...map.entries()].map(([Key, Value]) => ({ Key, Value }));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const stageIdx = args.indexOf("--stage");
  const stage = stageIdx >= 0 ? args[stageIdx + 1] : "dev";
  if (!STAGE_CONFIG[stage]) {
    console.error(`Unknown stage "${stage}". Use --stage dev|prod`);
    process.exit(1);
  }
  return { stage, dryRun: args.includes("--dry-run") };
}

function awsJson(args, profile) {
  const output = execFileSync(
    "aws",
    [...args, "--profile", profile, "--output", "json"],
    { encoding: "utf8" }
  );
  return JSON.parse(output);
}

function aws(args, profile) {
  execFileSync("aws", [...args, "--profile", profile], { stdio: "inherit" });
}

function getExistingTags(bucket, profile) {
  try {
    const { TagSet } = awsJson(
      ["s3api", "get-bucket-tagging", "--bucket", bucket],
      profile
    );
    return TagSet ?? [];
  } catch (err) {
    const msg = `${err.stderr ?? ""}${err.message ?? ""}`;
    if (msg.includes("NoSuchTagSet")) {
      return [];
    }
    throw err;
  }
}

function putTags(bucket, tagSet, profile) {
  const configPath = join(tmpdir(), `apfront-s3-tags-${Date.now()}.json`);
  writeFileSync(configPath, JSON.stringify({ TagSet: tagSet }));
  try {
    aws(
      [
        "s3api",
        "put-bucket-tagging",
        "--bucket",
        bucket,
        "--tagging",
        `file://${configPath}`,
      ],
      profile
    );
  } finally {
    unlinkSync(configPath);
  }
}

function main() {
  const { stage, dryRun } = parseArgs();
  const { bucket, profile } = STAGE_CONFIG[stage];
  const existing = getExistingTags(bucket, profile);
  const merged = mergeCostAllocationTags(existing, stage);
  const desired = apCostAllocationTagItems(stage);
  const unchanged =
    desired.every((t) =>
      existing.some((e) => e.Key === t.Key && e.Value === t.Value)
    ) && merged.length === existing.length;

  if (unchanged) {
    console.log(`S3 cost tags already set on ${bucket}`);
    return;
  }

  if (dryRun) {
    console.log(
      `Dry run — would set ${merged.length} tag(s) on ${bucket}:`,
      merged.map((t) => `${t.Key}=${t.Value}`).join(", ")
    );
    return;
  }

  putTags(bucket, merged, profile);
  console.log(`Updated S3 cost allocation tags on ${bucket}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
