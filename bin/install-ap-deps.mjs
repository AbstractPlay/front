/* eslint-env node */
/**
 * Resolve and install pinned @abstractplay/gameslib / @abstractplay/renderer versions.
 *
 * Resolution order:
 *   1. AP_GAMESLIB_VERSION / AP_RENDERER_VERSION env (from repository_dispatch)
 *   2. ci-deps.<stage>.json (ci-deps.dev.json or ci-deps.prod.json)
 *   3. fallback: @development (dev) or @latest (prod)
 *
 * Usage: node bin/install-ap-deps.mjs --stage dev|prod [--renderer-only] [--for-tests]
 *
 * --for-tests: install ci-deps pins without rewriting package.json or prod registry checks
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_CI_DEPS_PATH = path.join(ROOT, "ci-deps.json");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

function parseArgs(argv) {
  let stage = "dev";
  let rendererOnly = false;
  let forTests = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--stage" && argv[i + 1]) {
      stage = argv[++i];
    } else if (argv[i] === "--renderer-only") {
      rendererOnly = true;
    } else if (argv[i] === "--for-tests") {
      forTests = true;
    }
  }
  if (stage !== "dev" && stage !== "prod") {
    throw new Error(`Invalid --stage "${stage}" (expected dev or prod)`);
  }
  return { stage, rendererOnly, forTests };
}

function ciDepsPath(stage) {
  return path.join(ROOT, `ci-deps.${stage}.json`);
}

function manifestLabel(stage) {
  return `ci-deps.${stage}.json`;
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

function readManifest(stage) {
  const staged = readJson(ciDepsPath(stage));
  if (staged) {
    return staged;
  }
  const legacy = readJson(LEGACY_CI_DEPS_PATH);
  if (legacy) {
    console.warn(
      `Warning: using legacy ci-deps.json; migrate to ${manifestLabel(stage)}`,
    );
    return legacy;
  }
  return null;
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

function resolveVersions({ stage, rendererOnly, forTests, pkgJson }) {
  const dispatchGameslib = process.env.AP_GAMESLIB_VERSION?.trim() || null;
  const dispatchRenderer = process.env.AP_RENDERER_VERSION?.trim() || null;
  const manifest = readManifest(stage);
  const onlyRenderer = detectRendererOnly(pkgJson, rendererOnly);
  const manifestName = manifestLabel(stage);

  let gameslib = dispatchGameslib || manifest?.gameslib || null;
  let renderer = dispatchRenderer || manifest?.renderer || null;
  let source = manifestName;

  if (forTests) {
    const testOverride = process.env.AP_GAMESLIB_TEST_VERSION?.trim();
    if (testOverride) {
      gameslib = testOverride;
      source = "for-tests@AP_GAMESLIB_TEST_VERSION";
    } else {
      source = `${manifestName} (for-tests)`;
    }
    console.log(
      `Test install: @abstractplay/gameslib@${gameslib ?? "(see ci-deps or fallback)"} ` +
        `(${source}, not synced to package.json)`,
    );
  } else if (dispatchGameslib || dispatchRenderer) {
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
    if (source === manifestName) {
      source = `fallback@${tag}`;
    }
  }

  return { stage, gameslib, renderer, rendererOnly: onlyRenderer, source, forTests };
}

function syncPackageJson(pkgJson, versions) {
  pkgJson.dependencies = pkgJson.dependencies ?? {};

  if (versions.renderer) {
    pkgJson.dependencies["@abstractplay/renderer"] = versions.renderer;
  }

  if (!versions.rendererOnly && versions.gameslib && !versions.forTests) {
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

function verifyInstalledVersions(versions) {
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

function verifyGameslibProductionBuild(versions) {
  if (versions.stage !== "prod" || versions.rendererOnly || versions.forTests) {
    return;
  }

  const gameslibRoot = path.join(ROOT, "node_modules", "@abstractplay", "gameslib");
  const metaPath = path.join(
    gameslibRoot,
    "build",
    "games",
    "_registry-meta.generated.json",
  );
  const flagsPath = path.join(
    gameslibRoot,
    "build",
    "games",
    "_build-flags.generated.js",
  );
  const installed = getInstalledVersion("@abstractplay/gameslib");

  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (meta.production !== true) {
      throw new Error(
        `Refusing prod install: @abstractplay/gameslib@${installed} ` +
          `has production=false in registry meta (${meta.gameCount} games, ` +
          `${(meta.experimentalUids ?? []).length} experimental). ` +
          `Pin a Production Server CI build in ci-deps.prod.json.`,
      );
    }
    console.log(
      `gameslib production registry verified (${meta.gameCount} games; experimental omitted)`,
    );
    return;
  }

  if (!fs.existsSync(flagsPath)) {
    throw new Error(
      `Production deploy could not verify @abstractplay/gameslib@${installed}: ` +
        `missing ${metaPath} and ${flagsPath}`,
    );
  }

  const flagsSource = fs.readFileSync(flagsPath, "utf8");
  if (!/APGAMES_PRODUCTION\s*=\s*true/.test(flagsSource)) {
    throw new Error(
      `Refusing prod install: @abstractplay/gameslib@${installed} ` +
        `does not set APGAMES_PRODUCTION=true in ${flagsPath}. ` +
        `Pin a Production Server CI build in ci-deps.prod.json.`,
    );
  }

  console.log("gameslib production build verified (APGAMES_PRODUCTION=true)");
}

function writeCiDeps(versions) {
  const outPath = ciDepsPath(versions.stage);

  if (versions.forTests) {
    const existing = readJson(outPath);
    if (!existing) {
      return;
    }
    const data = { ...existing };
    if (versions.renderer) {
      data.renderer = versions.renderer;
      data.updatedAt = new Date().toISOString();
    }
    writeJson(outPath, data);
    return;
  }

  const data = {
    renderer: versions.renderer,
    updatedAt: new Date().toISOString(),
    source: versions.source,
  };
  if (!versions.rendererOnly && versions.gameslib) {
    data.gameslib = versions.gameslib;
  }
  writeJson(outPath, data);
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
verifyInstalledVersions(versions);
verifyGameslibProductionBuild(versions);
writeCiDeps(versions);
writeGithubOutput(versions);

console.log("AP dependencies installed and verified.");
