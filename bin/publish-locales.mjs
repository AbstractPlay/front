/* eslint-env node */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const STAGE_CONFIG = {
  dev: {
    bucket: "abstract-play-dev",
    distributionId: "E621UP8SM3SXE",
    profile: "AbstractPlayDev",
  },
  prod: {
    bucket: "abstract-play-prod",
    distributionId: "EZ7B67NVBQ903",
    profile: "AbstractPlayProd",
  },
};

const SUPPORTED_LANGUAGES = ["en", "fr", "de", "it"];
const CACHE_CONTROL = "public, max-age=3600";

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

function stripSrc(data, lang) {
  if (lang === "en" || !data || typeof data !== "object") {
    return data;
  }
  const { _src, ...rest } = data;
  return rest;
}

function prepareLocaleFile(sourcePath, lang) {
  const raw = fs.readFileSync(sourcePath, "utf8");
  const data = JSON.parse(raw);
  const cleaned = stripSrc(data, lang);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ap-locales-"));
  const tmpPath = path.join(tmpDir, path.basename(sourcePath));
  fs.writeFileSync(tmpPath, JSON.stringify(cleaned));
  return { tmpPath, tmpDir };
}

function uploadFile(localPath, s3Key, config) {
  const s3Uri = `s3://${config.bucket}/${s3Key}`;
  console.log(`Uploading ${s3Key}`);
  execFileSync(
    "aws",
    [
      "s3",
      "cp",
      localPath,
      s3Uri,
      "--content-type",
      "application/json",
      "--cache-control",
      CACHE_CONTROL,
      "--profile",
      config.profile,
    ],
    { stdio: "inherit" },
  );
}

function uploadLocaleDir(localDir, config) {
  if (!fs.existsSync(localDir)) {
    console.warn(`Skipping missing locale dir: ${localDir}`);
    return 0;
  }

  let count = 0;
  const tmpDirs = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    const langDir = path.join(localDir, lang);
    if (!fs.existsSync(langDir)) {
      continue;
    }

    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith(".json")) {
        continue;
      }
      const sourcePath = path.join(langDir, file);
      const { tmpPath, tmpDir } = prepareLocaleFile(sourcePath, lang);
      tmpDirs.push(tmpDir);
      uploadFile(tmpPath, `locales/${lang}/${file}`, config);
      count += 1;
    }
  }

  for (const tmpDir of tmpDirs) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return count;
}

function invalidateCloudFront(config) {
  console.log("Invalidating CloudFront /locales/*");
  execFileSync(
    "aws",
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      config.distributionId,
      "--paths",
      "/locales/*",
      "--profile",
      config.profile,
    ],
    { stdio: "inherit" },
  );
}

function main() {
  const { stage, config } = parseArgs();
  console.log(`Publishing locale files to ${config.bucket} (${stage})`);

  const sources = [
    { label: "front", dir: path.join(ROOT, "public", "locales") },
    {
      label: "gameslib",
      dir: path.join(ROOT, "node_modules", "@abstractplay", "gameslib", "locales"),
    },
  ];

  let total = 0;
  for (const { label, dir } of sources) {
    const uploaded = uploadLocaleDir(dir, config);
    console.log(`Uploaded ${uploaded} file(s) from ${label}`);
    total += uploaded;
  }

  if (total === 0) {
    console.error("No locale files found to upload");
    process.exit(1);
  }

  invalidateCloudFront(config);
  console.log(`Done. Published ${total} locale file(s).`);
}

main();
