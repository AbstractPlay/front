/* eslint-env node */
/**
 * Upload Vite `build/` to the play S3 bucket without deleting existing objects,
 * and put index.html last so new shells never reference missing hashed assets.
 *
 * Replaces `serverless client deploy` for routine releases. Bucket / CloudFront
 * infra still comes from `serverless deploy` + serverless-single-page-app-plugin.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { planStaticDeploySteps, CACHE_SHELL } from "./staticDeployCache.mjs";
import {
  STATIC_INVENTORY_S3_KEY,
  buildStaticInventoryDocument,
  collectBuildAssetKeys,
} from "./staticDeployInventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BUILD_DIR = path.join(ROOT, "build");
const AWS_REGION = "us-east-1";

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
  return { stage, config: STAGE_CONFIG[stage] };
}

function awsProfileArgs(config) {
  return ["--profile", config.profile, "--region", AWS_REGION];
}

function runAws(args, config) {
  execFileSync("aws", [...args, ...awsProfileArgs(config)], { stdio: "inherit" });
}

export function assertBuildReady(buildDir = DEFAULT_BUILD_DIR) {
  if (!fs.existsSync(buildDir)) {
    console.error(
      `Missing build directory: ${buildDir} (run npm run build-dev or build-prod first)`,
    );
    process.exit(1);
  }
  for (const file of ["index.html", "error.html"]) {
    const p = path.join(buildDir, file);
    if (!fs.existsSync(p)) {
      console.error(`Missing ${file} in build output (${p})`);
      process.exit(1);
    }
  }
}

function syncSubdir(buildDir, localSubdir, s3Prefix, cacheControl, config) {
  const localPath = path.join(buildDir, localSubdir);
  if (!fs.existsSync(localPath)) {
    console.log(`Skipping missing ${localSubdir}/`);
    return;
  }
  const dest = `s3://${config.bucket}/${s3Prefix}/`;
  console.log(`Sync ${localSubdir}/ → ${dest} (${cacheControl})`);
  runAws(
    [
      "s3",
      "sync",
      localPath,
      dest,
      "--cache-control",
      cacheControl,
    ],
    config,
  );
}

function syncBuildRootExceptShell(buildDir, cacheControl, exclude, config) {
  const dest = `s3://${config.bucket}/`;
  console.log(`Sync build root → ${dest} (${cacheControl}, shell HTML excluded)`);
  const args = [
    "s3",
    "sync",
    buildDir,
    dest,
    "--cache-control",
    cacheControl,
  ];
  for (const pattern of exclude) {
    args.push("--exclude", pattern);
  }
  runAws(args, config);
}

function cpShellFile(buildDir, file, cacheControl, config) {
  const localPath = path.join(buildDir, file);
  const dest = `s3://${config.bucket}/${file}`;
  console.log(`Upload ${file} → ${dest} (${cacheControl})`);
  runAws(
    [
      "s3",
      "cp",
      localPath,
      dest,
      "--cache-control",
      cacheControl,
      "--content-type",
      "text/html; charset=utf-8",
    ],
    config,
  );
}

export function uploadStaticInventory(config, buildDir = DEFAULT_BUILD_DIR) {
  const keys = collectBuildAssetKeys(buildDir);
  const doc = buildStaticInventoryDocument(keys);
  const tmpPath = path.join(tmpdir(), `ap-static-inventory-${Date.now()}.json`);
  fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
  const dest = `s3://${config.bucket}/${STATIC_INVENTORY_S3_KEY}`;
  console.log(`Upload inventory (${keys.length} keys) → ${dest}`);
  try {
    runAws(
      [
        "s3",
        "cp",
        tmpPath,
        dest,
        "--cache-control",
        CACHE_SHELL,
        "--content-type",
        "application/json",
      ],
      config,
    );
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

export function executeStaticDeploy(config, buildDir = DEFAULT_BUILD_DIR) {
  const steps = planStaticDeploySteps(buildDir);
  for (const step of steps) {
    if (step.kind === "sync") {
      syncSubdir(
        buildDir,
        step.localSubdir,
        step.s3Prefix,
        step.cacheControl,
        config,
      );
    } else if (step.kind === "sync-root") {
      syncBuildRootExceptShell(
        buildDir,
        step.cacheControl,
        step.exclude,
        config,
      );
    } else if (step.kind === "cp") {
      cpShellFile(buildDir, step.file, step.cacheControl, config);
    }
  }
  uploadStaticInventory(config, buildDir);
}

function main() {
  const { stage, config } = parseArgs();
  console.log(
    `Deploying static build to ${config.bucket} (${stage}, no delete, index last)`,
  );
  assertBuildReady();
  executeStaticDeploy(config);
  console.log("Static deploy finished.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
