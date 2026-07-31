/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FRONT_LOCALES = path.join(ROOT, "public", "locales");
const BUNDLE_LOCALES_EN = path.join(ROOT, "src", "locales", "en");
const GAMESLIB_LOCALES = path.join(
  ROOT,
  "node_modules",
  "@abstractplay",
  "gameslib",
  "locales",
);

const BUNDLED_EN_NAMESPACES = ["apfront", "apgames", "apresults"];

function copyLocaleTree(sourceRoot, namespaces) {
  if (!fs.existsSync(sourceRoot)) {
    console.warn(`Skipping missing locale source: ${sourceRoot}`);
    return;
  }

  for (const lang of fs.readdirSync(sourceRoot)) {
    const langDir = path.join(sourceRoot, lang);
    if (!fs.statSync(langDir).isDirectory()) {
      continue;
    }

    const targetLangDir = path.join(FRONT_LOCALES, lang);
    fs.mkdirSync(targetLangDir, { recursive: true });

    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith(".json")) {
        continue;
      }
      const namespace = file.replace(/\.json$/, "");
      if (!namespaces.includes(namespace)) {
        continue;
      }
      fs.copyFileSync(path.join(langDir, file), path.join(targetLangDir, file));
    }
  }
}

function syncBundledEnglish() {
  fs.mkdirSync(BUNDLE_LOCALES_EN, { recursive: true });

  const missing = [];
  for (const ns of BUNDLED_EN_NAMESPACES) {
    const sourcePath = path.join(FRONT_LOCALES, "en", `${ns}.json`);
    if (!fs.existsSync(sourcePath)) {
      missing.push(sourcePath);
      continue;
    }
    fs.copyFileSync(sourcePath, path.join(BUNDLE_LOCALES_EN, `${ns}.json`));
  }

  if (missing.length > 0) {
    console.error("Missing English locale files required for bundled fallback:");
    for (const p of missing) {
      console.error(`  ${p}`);
    }
    process.exit(1);
  }

  console.log("Synced English locale files into src/locales/en for bundling");
}

fs.mkdirSync(FRONT_LOCALES, { recursive: true });
copyLocaleTree(GAMESLIB_LOCALES, ["apgames", "apresults"]);
console.log("Synced gameslib locale files into public/locales");
syncBundledEnglish();
