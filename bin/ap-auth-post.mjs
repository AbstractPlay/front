#!/usr/bin/env node
/**
 * Run node-backend ap-post.mjs with credentials from front/.env.local.
 *
 * Usage (from front repo root):
 *   node bin/ap-auth-post.mjs path/to/request.json
 *   node bin/ap-auth-post.mjs path/to/request.json --stage prod
 *
 * .env.local (gitignored):
 *   AP_TEST_USER=...
 *   AP_TEST_PASSWORD=...
 *   AP_TEST_STAGE=dev|prod   (optional default for --stage)
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(__dirname, "..");
const envPath = path.join(frontRoot, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    return;
  }
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function main() {
  loadEnvLocal();
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.error(`Usage: node bin/ap-auth-post.mjs <request.json> [--stage dev|prod]`);
    process.exit(1);
  }
  const hasStage = args.some((a) => a === "--stage");
  if (!hasStage && process.env.AP_TEST_STAGE?.trim()) {
    args.push("--stage", process.env.AP_TEST_STAGE.trim());
  }
  const apPost = path.resolve(frontRoot, "../node-backend/bin/ap-post.mjs");
  const result = spawnSync(process.execPath, [apPost, ...args], {
    cwd: frontRoot,
    env: process.env,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

main();
