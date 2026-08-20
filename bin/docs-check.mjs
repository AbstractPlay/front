/* eslint-env node */
/**
 * Run AbstractPlay/docs link check against this repo's working tree.
 *
 * Local: requires a sibling checkout ../docs (same parent as front/).
 * CI: set AP_DOCS_ROOT to the checked-out docs repo (e.g. _ap_docs).
 *
 * Copies the current front tree into docs/vendor/front (excluding node_modules
 * and build) so docs:check validates your branch, not a stale submodule pin.
 */
import { execFileSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = process.env.AP_DOCS_ROOT
  ? path.resolve(process.env.AP_DOCS_ROOT)
  : path.resolve(FRONT_ROOT, "..", "docs");
const DOCS_CHECK = path.join(DOCS_ROOT, "scripts", "docs-check.js");
const VENDOR_FRONT = path.join(DOCS_ROOT, "vendor", "front");

const EXCLUDED_TOP_LEVEL = new Set(["node_modules", "build", ".git", "_ap_docs"]);

const OTHER_VENDORS = ["renderer", "gameslib", "node-backend", "recranks", "backend-crons"];

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

function prepareDocsCheckout() {
  execSync("git submodule sync --recursive", { cwd: DOCS_ROOT, stdio: "inherit" });
  execSync("git submodule update --init --recursive", { cwd: DOCS_ROOT, stdio: "inherit" });
  for (const vendor of OTHER_VENDORS) {
    const vendorPath = path.join(DOCS_ROOT, "vendor", vendor);
    execSync("git fetch --depth=1 origin develop", { cwd: vendorPath, stdio: "inherit" });
    execSync("git checkout FETCH_HEAD", { cwd: vendorPath, stdio: "inherit" });
  }
  execSync("npm ci", { cwd: DOCS_ROOT, stdio: "inherit" });
}

if (!fs.existsSync(DOCS_CHECK)) {
  console.error(
    "docs-check: clone https://github.com/AbstractPlay/docs as a sibling of front/ " +
      `(expected ${DOCS_ROOT}) or set AP_DOCS_ROOT for CI`
  );
  process.exit(1);
}

if (process.env.AP_DOCS_ROOT) {
  prepareDocsCheckout();
}

syncFrontToVendor();

execFileSync(process.execPath, [DOCS_CHECK], {
  cwd: DOCS_ROOT,
  stdio: "inherit",
});
