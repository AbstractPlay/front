/* eslint-env node */
/**
 * Validate split ci-deps manifests (ci-deps.dev.json / ci-deps.prod.json).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`check-ci-deps: ${message}`);
  process.exit(1);
}

const legacyPath = path.join(ROOT, "ci-deps.json");
if (fs.existsSync(legacyPath)) {
  fail("remove legacy ci-deps.json; use ci-deps.dev.json and ci-deps.prod.json");
}

const stages = ["dev", "prod"];
const manifests = {};

for (const stage of stages) {
  const filePath = path.join(ROOT, `ci-deps.${stage}.json`);
  if (!fs.existsSync(filePath)) {
    fail(`missing ${path.basename(filePath)}`);
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!data.renderer) {
    fail(`${path.basename(filePath)} must include renderer`);
  }
  manifests[stage] = data;
}

const pkgJsonPath = path.join(ROOT, "package.json");
if (fs.existsSync(pkgJsonPath)) {
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const deps = pkgJson.dependencies ?? {};
  const usesGameslib = "@abstractplay/gameslib" in deps;
  if (usesGameslib) {
    for (const stage of stages) {
      if (!manifests[stage].gameslib) {
        fail(`ci-deps.${stage}.json must include gameslib for this consumer`);
      }
    }
  }

  const dev = manifests.dev;
  if (usesGameslib && dev.gameslib && deps["@abstractplay/gameslib"] !== dev.gameslib) {
    fail(
      `package.json gameslib is ${deps["@abstractplay/gameslib"]} but ci-deps.dev.json pins ${dev.gameslib}. ` +
        "Run: node bin/install-ap-deps.mjs --stage dev",
    );
  }
  if (dev.renderer && deps["@abstractplay/renderer"] !== dev.renderer) {
    fail(
      `package.json renderer is ${deps["@abstractplay/renderer"]} but ci-deps.dev.json pins ${dev.renderer}. ` +
        "Run: node bin/install-ap-deps.mjs --stage dev",
    );
  }
  const overrideRenderer = pkgJson.overrides?.["@abstractplay/renderer"];
  if (dev.renderer && overrideRenderer && overrideRenderer !== dev.renderer) {
    fail(
      `package.json overrides renderer is ${overrideRenderer} but ci-deps.dev.json pins ${dev.renderer}. ` +
        "Run: node bin/install-ap-deps.mjs --stage dev",
    );
  }
}

if (
  manifests.prod.gameslib &&
  manifests.dev.gameslib &&
  manifests.prod.gameslib === manifests.dev.gameslib
) {
  console.warn(
    "check-ci-deps: warning: prod and dev pin the same gameslib version",
  );
}

console.log("check-ci-deps OK");
