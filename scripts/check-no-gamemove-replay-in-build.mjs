#!/usr/bin/env node
/**
 * Fail if Game Move replay tooling leaked into a production build artifact.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildJsDir = path.resolve(__dirname, "../build/static/js");

const SENTINELS = [
  "abstractplay-gamemove-replay",
  "importReplayBundleBySlug",
  "GAMEMOVE_REPLAY_SLUGS",
];

function main() {
  if (!fs.existsSync(buildJsDir)) {
    console.error(`Missing build output: ${buildJsDir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(buildJsDir).filter((f) => f.endsWith(".js"));
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(buildJsDir, file), "utf8");
    for (const sentinel of SENTINELS) {
      if (text.includes(sentinel)) {
        hits.push({ file, sentinel });
      }
    }
  }
  if (hits.length > 0) {
    console.error("Game Move replay sentinels found in build output:");
    for (const h of hits) {
      console.error(`  ${h.file}: ${h.sentinel}`);
    }
    process.exit(1);
  }
  console.log("check-no-gamemove-replay-in-build: OK");
}

main();
