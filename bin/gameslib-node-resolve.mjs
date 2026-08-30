/**
 * Resolve @abstractplay/gameslib to the Node build via filesystem URL.
 * Plain Node (test:engines) has no Vite alias; package subpath imports must not
 * depend on deep exports entries.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const gameslibNodeEntry = pathToFileURL(
  path.join(ROOT, "../node_modules/@abstractplay/gameslib/build/index.js"),
).href;

const GAMESLIB_SPECIFIERS = new Set([
  "@abstractplay/gameslib",
  "@abstractplay/gameslib/",
]);

export async function resolve(specifier, context, nextResolve) {
  if (GAMESLIB_SPECIFIERS.has(specifier)) {
    return { shortCircuit: true, url: gameslibNodeEntry };
  }
  return nextResolve(specifier, context);
}
