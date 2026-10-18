import fs from "fs";
import readline from "readline";

/**
 * Parse DevTools trace JSON with one event object per line (typical export).
 * Avoids loading multi-hundred-MB files into a single string.
 */
export async function readTraceMetadata(tracePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(tracePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let meta = null;
  for await (const line of rl) {
    if (line.includes('"startTime"')) {
      const m = line.match(/"startTime":\s*"([^"]+)"/);
      if (m) meta = { startTime: m[1] };
    }
    if (line.includes('"traceEvents"')) break;
  }
  rl.close();
  return meta;
}

export async function forEachTraceEvent(tracePath, onEvent) {
  const rl = readline.createInterface({
    input: fs.createReadStream(tracePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let inEvents = false;
  for await (const line of rl) {
    if (!inEvents) {
      if (line.includes('"traceEvents"')) inEvents = true;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === "]" || trimmed.startsWith("]")) break;
    if (!trimmed.startsWith("{")) continue;
    const jsonLine = trimmed.replace(/,\s*$/, "");
    try {
      onEvent(JSON.parse(jsonLine));
    } catch {
      // skip malformed lines
    }
  }
}
