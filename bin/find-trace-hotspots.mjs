/**
 * Find top FunctionCall line:col in a trace for symbolication.
 * Usage: node bin/find-trace-hotspots.mjs <trace.json> [--bundle index-….js] [--fn sr]
 */
import { forEachTraceEvent } from "./chrome-trace-stream.mjs";
import { isRendererMain, parseArgs } from "./chrome-trace-utils.mjs";

const args = parseArgs(process.argv);
const tracePath = args._[0];
const fnFilter = args.fn || null;
const bundleArg = args.bundle || "index-uvuaIUWL.js";

if (!tracePath) {
  console.error(
    "Usage: node bin/find-trace-hotspots.mjs <trace.json> [--fn name] [--bundle …]"
  );
  process.exit(1);
}

const rendererTid = new Map();
const bundleCounts = new Map();
const agg = new Map();

await forEachTraceEvent(tracePath, (e) => {
  if (
    e.ph === "M" &&
    e.name === "thread_name" &&
    e.args?.name === "CrRendererMain"
  ) {
    rendererTid.set(e.pid, e.tid);
    return;
  }
  if (!isRendererMain(e, rendererTid) || e.name !== "FunctionCall" || !e.dur) {
    return;
  }
  const fn = e.args?.data?.functionName ?? "";
  if (fnFilter && fn !== fnFilter) return;
  const url = e.args?.data?.url ?? "";
  const m = url.match(/\/(index-[^/]+\.js)/);
  if (m) bundleCounts.set(m[1], (bundleCounts.get(m[1]) ?? 0) + 1);
  if (!url.includes(bundleArg)) return;
  const line = e.args?.data?.lineNumber;
  const col = e.args?.data?.columnNumber;
  if (line == null) return;
  const key = `${fn}@${line}:${col}`;
  agg.set(key, (agg.get(key) ?? 0) + e.dur);
});

let bundle = bundleArg;
let bestN = 0;
for (const [name, n] of bundleCounts) {
  if (n > bestN) {
    bundle = name;
    bestN = n;
  }
}

console.log("Bundle:", bundle);
for (const [k, d] of [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`${(d / 1e6).toFixed(3)}s  ${k}`);
}
