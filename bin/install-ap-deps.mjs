/* eslint-env node */
/**
 * Resolve and install pinned @abstractplay/gameslib / @abstractplay/renderer versions.
 *
 * Resolution order:
 *   1. AP_GAMESLIB_VERSION / AP_RENDERER_VERSION env (from repository_dispatch)
 *   2. ci-deps.json
 *   3. fallback: @development (dev) or @latest (prod)
 *
 * Usage: node bin/install-ap-deps.mjs --stage dev|prod [--renderer-only]
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CI_DEPS_PATH = path.join(ROOT, "ci-deps.json");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

function parseArgs(argv) {
  let stage = "dev";
  let rendererOnly = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--stage" && argv[i + 1]) {
      stage = argv[++i];
    } else if (argv[i] === "--renderer-only") {
      rendererOnly = true;
    }
  }
  return { stage, rendererOnly };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function getInstalledVersion(pkg) {
  const pkgPath = path.join(ROOT, "node_modules", ...pkg.split("/"), "package.json");
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
  }

  try {
    const out = execSync(`npm ls ${pkg} --depth=0 --json`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(out).dependencies?.[pkg]?.version ?? null;
  } catch (err) {
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout).dependencies?.[pkg]?.version ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function detectRendererOnly(pkgJson, flag) {
  if (flag) {
    return true;
  }
  return !("@abstractplay/gameslib" in (pkgJson.dependencies ?? {}));
}

function resolveVersions({ stage, rendererOnly, pkgJson }) {
  const dispatchGameslib = process.env.AP_GAMESLIB_VERSION?.trim() || null;
  const dispatchRenderer = process.env.AP_RENDERER_VERSION?.trim() || null;
  const manifest = readJson(CI_DEPS_PATH);
  const onlyRenderer = detectRendererOnly(pkgJson, rendererOnly);

  let gameslib = dispatchGameslib || manifest?.gameslib || null;
  let renderer = dispatchRenderer || manifest?.renderer || null;
  let source = "ci-deps.json";

  if (dispatchGameslib || dispatchRenderer) {
    source = process.env.AP_SOURCE || "repository_dispatch";
  }

  const tag = stage === "prod" ? "latest" : "development";

  if (!renderer) {
    console.warn(`No renderer version resolved; falling back to @${tag}`);
    renderer = tag;
    source = `fallback@${tag}`;
  }

  if (!onlyRenderer && !gameslib) {
    console.warn(`No gameslib version resolved; falling back to @${tag}`);
    gameslib = tag;
    if (source === "ci-deps.json") {
      source = `fallback@${tag}`;
    }
  }

  return { gameslib, renderer, rendererOnly: onlyRenderer, source };
}

function syncPackageJson(pkgJson, versions) {
  pkgJson.dependencies = pkgJson.dependencies ?? {};

  if (versions.renderer) {
    pkgJson.dependencies["@abstractplay/renderer"] = versions.renderer;
  }

  if (!versions.rendererOnly && versions.gameslib) {
    pkgJson.dependencies["@abstractplay/gameslib"] = versions.gameslib;
  }

  const hasDirectRenderer =
    "@abstractplay/renderer" in (pkgJson.dependencies ?? {});

  if (!versions.rendererOnly && versions.renderer) {
    pkgJson.overrides = pkgJson.overrides ?? {};
    pkgJson.overrides["@abstractplay/renderer"] = versions.renderer;
  } else if (versions.rendererOnly && hasDirectRenderer && versions.renderer) {
    pkgJson.overrides = pkgJson.overrides ?? {};
    pkgJson.overrides["@abstractplay/renderer"] = versions.renderer;
  }

  writeJson(PACKAGE_JSON_PATH, pkgJson);
}

function installPackages(versions) {
  const pkgs = [`@abstractplay/renderer@${versions.renderer}`];
  if (!versions.rendererOnly && versions.gameslib) {
    pkgs.unshift(`@abstractplay/gameslib@${versions.gameslib}`);
  }
  console.log(`Installing: ${pkgs.join(" ")}`);
  execSync(`npm install --save-exact ${pkgs.join(" ")}`, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function versionMatches(installed, expected) {
  if (!installed) {
    return false;
  }
  if (expected === "development" || expected === "latest") {
    return true;
  }
  return installed === expected;
}

function verify(versions) {
  const installedRenderer = getInstalledVersion("@abstractplay/renderer");
  if (!versionMatches(installedRenderer, versions.renderer)) {
    throw new Error(
      `Renderer version mismatch: expected ${versions.renderer}, got ${installedRenderer}`,
    );
  }
  console.log(`@abstractplay/renderer@${installedRenderer}`);

  if (!versions.rendererOnly) {
    const installedGameslib = getInstalledVersion("@abstractplay/gameslib");
    if (!versionMatches(installedGameslib, versions.gameslib)) {
      throw new Error(
        `Gameslib version mismatch: expected ${versions.gameslib}, got ${installedGameslib}`,
      );
    }
    console.log(`@abstractplay/gameslib@${installedGameslib}`);
  }
}

function writeCiDeps(versions) {
  const data = {
    renderer: versions.renderer,
    updatedAt: new Date().toISOString(),
    source: versions.source,
  };
  if (!versions.rendererOnly && versions.gameslib) {
    data.gameslib = versions.gameslib;
  }
  writeJson(CI_DEPS_PATH, data);
}

function writeGithubOutput(versions) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (!outFile) {
    return;
  }
  fs.appendFileSync(outFile, `renderer_version=${versions.renderer}\n`);
  if (versions.gameslib) {
    fs.appendFileSync(outFile, `gameslib_version=${versions.gameslib}\n`);
  }
}

const args = parseArgs(process.argv);
const pkgJson = readJson(PACKAGE_JSON_PATH);
if (!pkgJson) {
  throw new Error(`Missing ${PACKAGE_JSON_PATH}`);
}

const versions = resolveVersions({ ...args, pkgJson });
console.log("Resolved AP dependency versions:", versions);

syncPackageJson(pkgJson, versions);
installPackages(versions);
verify(versions);
writeCiDeps(versions);
writeGithubOutput(versions);

console.log("AP dependencies installed and verified.");
