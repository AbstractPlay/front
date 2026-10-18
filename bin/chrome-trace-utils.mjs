import fs from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(path.join(__dirname, "../package.json"));

export function loadTrace(tracePath) {
  const raw = fs.readFileSync(tracePath, "utf8");
  const data = JSON.parse(raw);
  const events = data.traceEvents ?? data;
  return { data, events, meta: data.metadata };
}

export function rendererMainTids(events) {
  const rendererTid = new Map();
  for (const e of events) {
    if (
      e.ph === "M" &&
      e.name === "thread_name" &&
      e.args?.name === "CrRendererMain"
    ) {
      rendererTid.set(e.pid, e.tid);
    }
  }
  return rendererTid;
}

export function isRendererMain(e, rendererTid) {
  const tid = rendererTid.get(e.pid);
  return tid !== undefined && e.tid === tid;
}

/** Most common `index-*.js` chunk in renderer FunctionCall URLs. */
export function detectMainBundleName(events, rendererTid) {
  const counts = new Map();
  for (const e of events) {
    if (!isRendererMain(e, rendererTid) || e.name !== "FunctionCall") continue;
    const url = e.args?.data?.url ?? "";
    const m = url.match(/\/(index-[^/]+\.js)/);
    if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  let best = "";
  let bestN = 0;
  for (const [name, n] of counts) {
    if (n > bestN) {
      best = name;
      bestN = n;
    }
  }
  return best;
}

export async function loadSourceMapConsumer(mapPath) {
  const { SourceMapConsumer } = require("source-map");
  const raw = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  return new SourceMapConsumer(raw);
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--bundle" && argv[i + 1]) {
      out.bundle = argv[++i];
    } else if (a.startsWith("--")) {
      const key = a.slice(2);
      out[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else {
      out._.push(a);
    }
  }
  return out;
}
