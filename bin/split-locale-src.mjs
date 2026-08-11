#!/usr/bin/env node
/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MANAGED_LANGS = ["de", "fr", "it", "es-US"];
const LOCALE_FILE = "apfront.json";
const GAMESLIB_LOCALES = path.resolve(ROOT, "..", "gameslib", "locales");
const GAMES_NAMESPACES = ["apgames.json", "apresults.json"];

function collectLeaves(obj, prefix = "") {
  const leaves = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return leaves;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) continue;
    const leafPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      leaves[leafPath] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(leaves, collectLeaves(value, leafPath));
    }
  }
  return leaves;
}

function sortObjectKeys(obj) {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function splitApfront(lang) {
  const localePath = path.join(ROOT, "public", "locales", lang, LOCALE_FILE);
  const srcPath = path.join(ROOT, "locale-src", lang, LOCALE_FILE);

  const data = JSON.parse(fs.readFileSync(localePath, "utf8"));
  if (!data._src || typeof data._src !== "object") {
    console.warn(`[${lang}/${LOCALE_FILE}] No _src block — skipping`);
    return false;
  }

  const src = sortObjectKeys(data._src);
  const translations = { ...data };
  delete translations._src;

  fs.mkdirSync(path.dirname(srcPath), { recursive: true });
  fs.writeFileSync(srcPath, JSON.stringify(src, null, 2) + "\n");
  fs.writeFileSync(localePath, JSON.stringify(translations, null, 2) + "\n");

  console.log(
    `[${lang}/${LOCALE_FILE}] split ${Object.keys(src).length} src keys, ${Object.keys(collectLeaves(translations)).length} translation leaves`,
  );
  return true;
}

function syncGameslibLocales() {
  if (!fs.existsSync(GAMESLIB_LOCALES)) {
    console.warn(`Gameslib locales not found at ${GAMESLIB_LOCALES} — skip games sync`);
    return;
  }

  for (const lang of ["en", ...MANAGED_LANGS]) {
    const sourceLangDir = path.join(GAMESLIB_LOCALES, lang);
    const targetLangDir = path.join(ROOT, "public", "locales", lang);
    if (!fs.existsSync(sourceLangDir)) continue;

    fs.mkdirSync(targetLangDir, { recursive: true });
    for (const file of GAMES_NAMESPACES) {
      const sourcePath = path.join(sourceLangDir, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(targetLangDir, file));
        console.log(`[${lang}/${file}] synced from gameslib`);
      }
    }
  }
}

function main() {
  let count = 0;
  for (const lang of MANAGED_LANGS) {
    if (splitApfront(lang)) {
      count++;
    }
  }
  syncGameslibLocales();
  console.log(`Done. Split ${count} apfront file(s).`);
}

main();
