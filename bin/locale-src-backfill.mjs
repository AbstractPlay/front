#!/usr/bin/env node
/* eslint-env node */
import path from "path";
import { fileURLToPath } from "url";
import { backfillManagedLocaleStamps } from "./translate.mjs";

function runCli() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const files = args.length > 0 ? args : ["public/locales/en/apfront.json"];

  let changed = false;
  for (const file of files) {
    if (backfillManagedLocaleStamps(path.resolve(file))) {
      changed = true;
    }
  }

  if (!changed) {
    console.log("All locale-src sidecars match English and managed locale files.");
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCli();
}
