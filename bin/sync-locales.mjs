/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FRONT_LOCALES = path.join(ROOT, "public", "locales");
const GAMESLIB_LOCALES = path.join(
  ROOT,
  "node_modules",
  "@abstractplay",
  "gameslib",
  "locales",
);

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

fs.mkdirSync(FRONT_LOCALES, { recursive: true });
copyLocaleTree(GAMESLIB_LOCALES, ["apgames", "apresults"]);
console.log("Synced gameslib locale files into public/locales");
