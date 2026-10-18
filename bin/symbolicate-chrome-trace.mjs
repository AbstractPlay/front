/**
 * Symbolicate Chrome trace FunctionCall samples with a Vite bundle source map.
 *
 *   node --max-old-space-size=8192 bin/symbolicate-chrome-trace.mjs aggregate <trace.json> <bundle.js.map>
 *   node --max-old-space-size=8192 bin/symbolicate-chrome-trace.mjs buckets <trace.json> <bundle.js.map>
 *   node bin/symbolicate-chrome-trace.mjs position <bundle.js.map> <line> <column>
 *
 * Optional: --bundle index-HASH.js (default: auto-detect from trace)
 */
import {
  detectMainBundleName,
  isRendererMain,
  loadSourceMapConsumer,
  loadTrace,
  parseArgs,
  rendererMainTids,
} from "./chrome-trace-utils.mjs";

const args = parseArgs(process.argv);
const mode = args._[0];

if (!mode || !["aggregate", "buckets", "position"].includes(mode)) {
  console.error(
    "Usage:\n" +
      "  symbolicate-chrome-trace.mjs aggregate <trace.json> <bundle.js.map> [--bundle name]\n" +
      "  symbolicate-chrome-trace.mjs buckets <trace.json> <bundle.js.map> [--bundle name]\n" +
      "  symbolicate-chrome-trace.mjs position <bundle.js.map> <line> <column>"
  );
  process.exit(1);
}

if (mode === "position") {
  const mapPath = args._[1];
  const line = Number(args._[2]);
  const col = Number(args._[3]);
  if (!mapPath || !line || col === undefined) {
    console.error("Usage: symbolicate-chrome-trace.mjs position <map> <line> <column>");
    process.exit(1);
  }
  const consumer = await loadSourceMapConsumer(mapPath);
  const orig = consumer.originalPositionFor({ line, column: col });
  console.log(
    orig.source?.replace(/^webpack:\/\/\//, "") ?? "?",
    `${orig.line}:${orig.column}`,
    orig.name ?? ""
  );
  consumer.destroy();
  process.exit(0);
}

const tracePath = args._[1];
const mapPath = args._[2];
if (!tracePath || !mapPath) {
  console.error("Need <trace.json> and <bundle.js.map>");
  process.exit(1);
}

console.log("Loading map…");
const consumer = await loadSourceMapConsumer(mapPath);
console.log("Loading trace…");
const { events } = loadTrace(tracePath);
const rendererTid = rendererMainTids(events);
const isR = (e) => isRendererMain(e, rendererTid);
const bundle = args.bundle || detectMainBundleName(events, rendererTid);
if (!bundle) {
  console.error("Could not detect main bundle; pass --bundle index-….js");
  consumer.destroy();
  process.exit(1);
}
console.log("Bundle:", bundle);

if (mode === "aggregate") {
  const byFile = new Map();
  const byFn = new Map();
  let mapped = 0;
  let total = 0;

  for (const e of events) {
    if (!isR(e) || e.name !== "FunctionCall" || !e.dur) continue;
    const url = e.args?.data?.url ?? "";
    if (!url.includes(bundle)) continue;
    total += e.dur;
    const line = e.args?.data?.lineNumber;
    const col = e.args?.data?.columnNumber;
    if (line == null || col == null) continue;
    const orig = consumer.originalPositionFor({ line, column: col });
    if (!orig.source) continue;
    mapped += e.dur;
    const file = orig.source
      .replace(/^webpack:\/\/\//, "")
      .replace(/^\.\.\/\.\.\/\.\.\//, "");
    byFile.set(file, (byFile.get(file) ?? 0) + e.dur);
    const fnKey = `${orig.name || "(anon)"} @ ${file}:${orig.line}`;
    byFn.set(fnKey, (byFn.get(fnKey) ?? 0) + e.dur);
  }

  console.log(
    `\nMapped ${(mapped / 1e6).toFixed(2)}s of ${(total / 1e6).toFixed(2)}s FunctionCall time\n`
  );

  console.log("=== By source file (top 25) ===");
  for (const [f, d] of [...byFile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)) {
    console.log(`${(d / 1e6).toFixed(3)}s  ${f}`);
  }

  console.log("\n=== By function (AP-related, top 30) ===");
  for (const [k, d] of [...byFn.entries()]
    .filter(([k]) => /front\/src|gameslib|renderer/.test(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)) {
    console.log(`${(d / 1e6).toFixed(3)}s  ${k}`);
  }

  console.log("\n=== By function (all, top 20) ===");
  for (const [k, d] of [...byFn.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)) {
    console.log(`${(d / 1e6).toFixed(3)}s  ${k}`);
  }
} else if (mode === "buckets") {
  const buckets = {
    react: 0,
    scheduler: 0,
    renderer: 0,
    gameslib: 0,
    gameMoveSrc: 0,
    zoom: 0,
    other: 0,
  };
  for (const e of events) {
    if (!isR(e) || e.name !== "FunctionCall" || !e.dur) continue;
    const url = e.args?.data?.url ?? "";
    if (!url.includes(bundle)) continue;
    const line = e.args?.data?.lineNumber;
    const col = e.args?.data?.columnNumber;
    if (line == null) continue;
    const o = consumer.originalPositionFor({ line, column: col });
    const s = o.source ?? "";
    let b = "other";
    if (s.includes("react-dom")) b = "react";
    else if (s.includes("scheduler")) b = "scheduler";
    else if (s.includes("@abstractplay/renderer")) b = "renderer";
    else if (s.includes("@abstractplay/gameslib")) b = "gameslib";
    else if (
      s.includes("/src/lib/GameMove") ||
      s.includes("/src/components/GameMove")
    )
      b = "gameMoveSrc";
    else if (s.includes("react-zoom-pan-pinch")) b = "zoom";
    buckets[b] += e.dur;
  }
  const tot = Object.values(buckets).reduce((a, v) => a + v, 0);
  console.log("\n=== FunctionCall time by bucket ===");
  for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1] - a[1])) {
    console.log(
      `${k.padEnd(12)} ${(v / 1e6).toFixed(3)}s  ${tot ? ((100 * v) / tot).toFixed(1) : 0}%`
    );
  }
}

consumer.destroy();
