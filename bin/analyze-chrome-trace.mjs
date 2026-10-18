/**
 * Summarize a Chrome Performance trace (DevTools export) for game-move / exploration work.
 *
 *   node --max-old-space-size=8192 bin/analyze-chrome-trace.mjs path/to/trace.json
 *
 * Large traces: gunzip first, e.g. gzip -d trace.json.gz
 */
import fs from "fs";
import {
  isRendererMain,
  loadTrace,
  rendererMainTids,
} from "./chrome-trace-utils.mjs";
import { forEachTraceEvent, readTraceMetadata } from "./chrome-trace-stream.mjs";

const tracePath = process.argv[2];
if (!tracePath) {
  console.error("Usage: node bin/analyze-chrome-trace.mjs <trace.json>");
  process.exit(1);
}

const STREAM_THRESHOLD = 400 * 1024 * 1024;
const useStream = fs.statSync(tracePath).size >= STREAM_THRESHOLD;

const LONG_US = 50_000;
const longTasks = [];
const fnDur = new Map();
const catDur = new Map();
const inputEvents = [];
const mouseupDispatches = [];
const dispatchByType = new Map();
const completeX = [];
let eventCount = 0;

const interestingName = (s) =>
  /render|GameFactory|processNewMove|doView|handleClick|exploration|gameslib|abstractplay|renderLive|createEngine|lodash|cloneDeep/i.test(
    s ?? ""
  );

let rendererTid = new Map();
let meta = null;
let isR = () => false;

console.log(useStream ? "Streaming trace…" : "Loading trace…");

async function processEvent(e) {
  eventCount++;
  if (e.ph === "M" && e.name === "thread_name" && e.args?.name === "CrRendererMain") {
    rendererTid.set(e.pid, e.tid);
    isR = (ev) => isRendererMain(ev, rendererTid);
    return;
  }
  if (!isRendererMain(e, rendererTid)) return;

  const dur = e.dur;
  if (dur && dur >= LONG_US) {
    longTasks.push({
      dur,
      name: e.name,
      cat: e.cat,
      ts: e.ts,
      args: e.args,
    });
  }
  if (dur && e.name === "FunctionCall") {
    const url = e.args?.data?.url ?? e.args?.url ?? "";
    const fn = e.args?.data?.functionName ?? e.args?.functionName ?? "";
    const key = fn ? `${fn} (${url.split("/").slice(-2).join("/")})` : url;
    if (key) fnDur.set(key, (fnDur.get(key) ?? 0) + dur);
    if (e.ph === "X") {
      completeX.push({ ts: e.ts, dur });
    }
  }
  if (dur && e.ph === "X") {
    catDur.set(e.name, (catDur.get(e.name) ?? 0) + dur);
  }
  if (e.name === "EventDispatch" && e.args?.data?.type && e.dur) {
    const type = e.args.data.type;
    dispatchByType.set(type, (dispatchByType.get(type) ?? 0) + e.dur);
    if (/^(click|pointerdown|mousedown)$/i.test(type)) {
      inputEvents.push({ ts: e.ts, dur: e.dur ?? 0, type });
    }
    if (type === "mouseup" && e.dur) {
      mouseupDispatches.push(e.dur / 1000);
    }
  }
}

if (useStream) {
  meta = await readTraceMetadata(tracePath);
  await forEachTraceEvent(tracePath, processEvent);
} else {
  const loaded = loadTrace(tracePath);
  meta = loaded.meta;
  rendererTid = rendererMainTids(loaded.events);
  isR = (e) => isRendererMain(e, rendererTid);
  for (const e of loaded.events) {
    await processEvent(e);
  }
}

console.log(
  "Events:",
  eventCount,
  meta?.startTime ? `start ${meta.startTime}` : ""
);

longTasks.sort((a, b) => b.dur - a.dur);
inputEvents.sort((a, b) => a.ts - b.ts);

console.log("\n=== Renderer long tasks (>=50ms), top 25 ===");
for (const t of longTasks.slice(0, 25)) {
  const ms = (t.dur / 1000).toFixed(1);
  const detail =
    t.args?.data?.functionName ??
    t.args?.detail ??
    t.args?.name ??
    "";
  console.log(`${ms}ms  ${t.name}  ${t.cat}  ${String(detail).slice(0, 120)}`);
}

console.log("\n=== EventDispatch total duration by type (top 12) ===");
for (const [type, dur] of [...dispatchByType.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)) {
  console.log(`${(dur / 1e6).toFixed(2)}s  ${type}`);
}

console.log("\n=== Top event names by total duration (renderer) ===");
for (const [name, dur] of [...catDur.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)) {
  console.log(`${(dur / 1e6).toFixed(2)}s total  ${name}`);
}

console.log("\n=== Top FunctionCall aggregates (AP-related names), top 30 ===");
for (const [k, dur] of [...fnDur.entries()]
  .filter(([k]) => interestingName(k))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)) {
  console.log(`${(dur / 1e6).toFixed(3)}s  ${k.slice(0, 140)}`);
}

console.log("\n=== All FunctionCall aggregates, top 20 ===");
for (const [k, dur] of [...fnDur.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)) {
  console.log(`${(dur / 1e6).toFixed(3)}s  ${k.slice(0, 140)}`);
}

function scriptingAfterClick(clickTs, windowUs = 500_000) {
  let sum = 0;
  let max = 0;
  for (const e of completeX) {
    if (e.ts >= clickTs && e.ts < clickTs + windowUs) {
      sum += e.dur;
      if (e.dur > max) max = e.dur;
    }
  }
  return { sum, max };
}

console.log(`\n=== Clicks/pointer downs: ${inputEvents.length} ===`);
const clickStats = inputEvents.map((c) => {
  const { sum, max } = scriptingAfterClick(c.ts);
  return { ...c, scriptMs: sum / 1000, maxCallMs: max / 1000 };
});
const withScript = clickStats.filter((c) => c.scriptMs > 5);
console.log(
  `Clicks with >5ms FunctionCall in 500ms window: ${withScript.length}`
);
const sorted = [...withScript].sort((a, b) => b.scriptMs - a.scriptMs);
for (const c of sorted.slice(0, 15)) {
  console.log(
    `${c.type} script~${c.scriptMs.toFixed(1)}ms maxCall~${c.maxCallMs.toFixed(1)}ms (dispatch ${(c.dur / 1000).toFixed(2)}ms)`
  );
}
if (withScript.length) {
  const avg =
    withScript.reduce((s, c) => s + c.scriptMs, 0) / withScript.length;
  const med = withScript.map((c) => c.scriptMs).sort((a, b) => a - b)[
    Math.floor(withScript.length / 2)
  ];
  console.log(
    `Median script after click: ${med?.toFixed(1)}ms  avg: ${avg.toFixed(1)}ms`
  );
}

// Click EventDispatch only (exclude pointerdown/mousedown duplicates)
const clickOnly = inputEvents.filter((c) => c.type === "click" && c.dur);
if (clickOnly.length) {
  const durs = clickOnly.map((c) => c.dur / 1000).sort((a, b) => a - b);
  const p = (pct) => durs[Math.floor((pct / 100) * (durs.length - 1))];
  console.log(
    `\n=== click EventDispatch only (${clickOnly.length}) ===\n` +
      `p50 ${p(50).toFixed(1)}ms  p90 ${p(90).toFixed(1)}ms  p95 ${p(95).toFixed(1)}ms  max ${durs[durs.length - 1].toFixed(1)}ms`
  );
}

if (mouseupDispatches.length) {
  mouseupDispatches.sort((a, b) => a - b);
  const p = (pct) =>
    mouseupDispatches[Math.floor((pct / 100) * (mouseupDispatches.length - 1))];
  console.log(
    `\n=== mouseup EventDispatch (${mouseupDispatches.length}) ===\n` +
      `p50 ${p(50).toFixed(1)}ms  p90 ${p(90).toFixed(1)}ms  max ${mouseupDispatches[mouseupDispatches.length - 1].toFixed(1)}ms`
  );
}
