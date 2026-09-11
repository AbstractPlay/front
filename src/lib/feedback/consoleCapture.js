const MAX_ENTRIES = 20;
const MAX_BYTES = 8192;

let installed = false;
const buffer = [];

function byteLength(entries) {
  return JSON.stringify(entries).length;
}

function pushEntry(entry) {
  buffer.push(entry);
  while (buffer.length > MAX_ENTRIES || byteLength(buffer) > MAX_BYTES) {
    buffer.shift();
  }
}

function sanitizeMessage(message) {
  if (typeof message !== "string") {
    return String(message);
  }
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/(token|session|cookie)=[^;\s]+/gi, "$1=[redacted]");
}

export function installConsoleCapture() {
  if (installed || typeof window === "undefined") {
    return;
  }
  installed = true;

  window.addEventListener("error", (event) => {
    pushEntry({
      ts: Date.now(),
      level: "error",
      message: sanitizeMessage(event.message),
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    pushEntry({
      ts: Date.now(),
      level: "error",
      message: sanitizeMessage(reason?.message ?? reason),
      stack: reason?.stack,
    });
  });

  const originalError = console.error.bind(console);
  console.error = (...args) => {
    pushEntry({
      ts: Date.now(),
      level: "error",
      message: sanitizeMessage(args.map(String).join(" ")),
    });
    originalError(...args);
  };
}

export function pushCapturedError(error, meta = {}) {
  if (!error) {
    return;
  }
  pushEntry({
    ts: Date.now(),
    level: "error",
    message: sanitizeMessage(error.message ?? String(error)),
    stack: error.stack,
    ...meta,
  });
}

export function getConsoleCaptureSnapshot() {
  return buffer.map((entry) => ({ ...entry }));
}
