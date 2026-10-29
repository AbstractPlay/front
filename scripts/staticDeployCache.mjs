/* eslint-env node */
/**
 * S3 Cache-Control for play site static deploy (mirrors serverless.yml objectHeaders).
 */

export const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";
export const CACHE_SHELL = "no-cache, no-store, must-revalidate";
export const CACHE_DEFAULT = "public, max-age=3600";

/** Uploaded last, in this order, after all other build artifacts. */
export const SHELL_HTML_FILES = ["error.html", "index.html"];

/**
 * Ordered deploy steps for `build/` → play bucket (no S3 deletes).
 * @param {string} buildDir absolute path to Vite output
 * @returns {Array<
 *   | { kind: "sync"; localSubdir: string; s3Prefix: string; cacheControl: string }
 *   | { kind: "sync-root"; cacheControl: string; exclude: string[] }
 *   | { kind: "cp"; file: string; cacheControl: string }
 * >}
 */
export function planStaticDeploySteps(buildDir) {
  const steps = [];

  steps.push({
    kind: "sync",
    localSubdir: "static",
    s3Prefix: "static",
    cacheControl: CACHE_IMMUTABLE,
  });

  steps.push({
    kind: "sync",
    localSubdir: "flags",
    s3Prefix: "flags",
    cacheControl: CACHE_IMMUTABLE,
  });

  steps.push({
    kind: "sync-root",
    cacheControl: CACHE_DEFAULT,
    exclude: [
      "static/*",
      "static/**",
      "flags/*",
      "flags/**",
      "index.html",
      "error.html",
    ],
  });

  for (const file of SHELL_HTML_FILES) {
    steps.push({
      kind: "cp",
      file,
      cacheControl: CACHE_SHELL,
    });
  }

  return steps;
}

export function shellHtmlComesLast(steps) {
  const cpFiles = steps.filter((s) => s.kind === "cp").map((s) => s.file);
  const lastTwo = steps.slice(-SHELL_HTML_FILES.length);
  return (
    cpFiles[cpFiles.length - 2] === "error.html"
    && cpFiles[cpFiles.length - 1] === "index.html"
    && lastTwo.every((s) => s.kind === "cp")
  );
}
