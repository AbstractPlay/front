/* eslint-env node */
/**
 * Run AbstractPlay/docs link check against this repo's working tree.
 *
 * Requires a sibling checkout: ../docs (same parent as front/).
 * Copies the current front tree into docs/vendor/front (excluding node_modules
 * and build) so docs:check validates your branch, not a stale submodule pin.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.resolve(FRONT_ROOT, "..", "docs");
const DOCS_CHECK = path.join(DOCS_ROOT, "scripts", "docs-check.js");
const VENDOR_FRONT = path.join(DOCS_ROOT, "vendor", "front");

const EXCLUDED_TOP_LEVEL = new Set(["node_modules", "build", ".git"]);

function shouldCopyEntry(name) {
  return !EXCLUDED_TOP_LEVEL.has(name);
}

function syncFrontToVendor() {
  fs.mkdirSync(path.join(DOCS_ROOT, "vendor"), { recursive: true });
  if (fs.existsSync(VENDOR_FRONT)) {
    fs.rmSync(VENDOR_FRONT, { recursive: true, force: true });
  }
  fs.mkdirSync(VENDOR_FRONT, { recursive: true });

  for (const entry of fs.readdirSync(FRONT_ROOT, { withFileTypes: true })) {
    if (!shouldCopyEntry(entry.name)) continue;
    const src = path.join(FRONT_ROOT, entry.name);
    const dest = path.join(VENDOR_FRONT, entry.name);
    fs.cpSync(src, dest, { recursive: true });
  }
}

if (!fs.existsSync(DOCS_CHECK)) {
  console.error(
    "docs-check: clone https://github.com/AbstractPlay/docs as a sibling of front/ " +
      `(expected ${DOCS_ROOT})`
  );
  process.exit(1);
}

syncFrontToVendor();

execFileSync(process.execPath, [DOCS_CHECK], {
  cwd: DOCS_ROOT,
  stdio: "inherit",
});
