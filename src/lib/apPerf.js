/**
 * Opt-in move-path timing for local / prod debugging.
 * Enable: localStorage.setItem('apPerf', '1') then reload.
 * Disable: localStorage.removeItem('apPerf')
 *
 * Logs [apPerf] lines to the console; also records User Timing measures (ap:*).
 */

export function apPerfEnabled() {
  return (
    typeof window !== "undefined" && localStorage.getItem("apPerf") === "1"
  );
}

function logLine(name, ms, detail) {
  const extra = detail ? ` (${detail})` : "";
  console.log(`[apPerf] ${name}: ${ms.toFixed(1)}ms${extra}`);
}

/**
 * @param {string} name
 * @param {() => T} fn
 * @returns {T}
 */
export function apPerfRun(name, fn) {
  if (!apPerfEnabled()) {
    return fn();
  }
  const markStart = `ap:${name}:start`;
  const markEnd = `ap:${name}:end`;
  performance.mark(markStart);
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    const ms = performance.now() - t0;
    performance.mark(markEnd);
    try {
      performance.measure(`ap:${name}`, markStart, markEnd);
    } catch {
      // duplicate measure name; ignore
    }
    logLine(name, ms);
  }
}

/**
 * @param {string} name
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function apPerfRunAsync(name, fn) {
  if (!apPerfEnabled()) {
    return fn();
  }
  const markStart = `ap:${name}:start`;
  const markEnd = `ap:${name}:end`;
  performance.mark(markStart);
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    const ms = performance.now() - t0;
    performance.mark(markEnd);
    try {
      performance.measure(`ap:${name}`, markStart, markEnd);
    } catch {
      // ignore
    }
    logLine(name, ms);
  }
}

/** Print aggregated ap:* measures from the Performance timeline. */
export function apPerfReport() {
  if (!apPerfEnabled()) {
    console.log("[apPerf] disabled — set localStorage.apPerf = '1' and reload");
    return;
  }
  const measures = performance
    .getEntriesByType("measure")
    .filter((m) => m.name.startsWith("ap:"));
  const byName = new Map();
  for (const m of measures) {
    const row = byName.get(m.name) ?? { count: 0, total: 0, max: 0 };
    row.count += 1;
    row.total += m.duration;
    row.max = Math.max(row.max, m.duration);
    byName.set(m.name, row);
  }
  const rows = [...byName.entries()]
    .map(([name, { count, total, max }]) => ({
      name: name.replace(/^ap:/, ""),
      count,
      avg: total / count,
      max,
      total,
    }))
    .sort((a, b) => b.total - a.total);
  console.table(rows);
}

if (typeof window !== "undefined") {
  window.apPerfReport = apPerfReport;
}
