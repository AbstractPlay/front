import {
  trackLayoutFeedback,
  trackLayoutFeedbackNote,
  trackLayoutSessionStart,
  trackLayoutSwitch,
  trackLayoutSwitchToClassic,
} from "./layoutFeedbackTracking";

const STORAGE_FEEDBACK_LOG = "gameMoveLayoutFeedbackLog";
const MAX_LOG_ENTRIES = 200;

function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_FEEDBACK_LOG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  try {
    localStorage.setItem(
      STORAGE_FEEDBACK_LOG,
      JSON.stringify(entries.slice(-MAX_LOG_ENTRIES))
    );
  } catch {
    // ignore quota / private browsing
  }
}

/** @typedef {{ type: string, layoutId: string, gameId?: string, rating?: 'up'|'down', comment?: string, toLayoutId?: string, durationMs?: number, timestamp: number }} LayoutFeedbackEvent */

/**
 * @param {Omit<LayoutFeedbackEvent, 'timestamp'>} event
 */
function mirrorToRemote(event) {
  const { type, layoutId, gameId, rating, comment, toLayoutId, durationMs } = event;
  switch (type) {
    case "session_start":
      trackLayoutSessionStart({ layoutId, gameId });
      break;
    case "feedback":
      if (rating) {
        trackLayoutFeedback({ layoutId, rating, gameId, durationMs });
      }
      break;
    case "feedback_note":
      if (comment) {
        trackLayoutFeedbackNote({ layoutId, comment, gameId, durationMs });
      }
      break;
    case "switch_to_classic":
      trackLayoutSwitchToClassic({ layoutId, gameId, durationMs });
      break;
    case "layout_switch":
      if (toLayoutId) {
        trackLayoutSwitch({ layoutId, toLayoutId, gameId });
      }
      break;
    default:
      break;
  }
}

/**
 * Record a layout experiment event locally (and to the console for dev inspection).
 * @param {Omit<LayoutFeedbackEvent, 'timestamp'>} event
 */
export function logLayoutFeedbackEvent(event) {
  const entry = {
    ...event,
    timestamp: Date.now(),
  };
  const next = [...readLog(), entry];
  writeLog(next);
  if (process.env.NODE_ENV !== "production") {
    console.info("[layout-feedback]", entry);
  }
  mirrorToRemote(event);
  return entry;
}

export function readLayoutFeedbackLog() {
  return readLog();
}

export function clearLayoutFeedbackLog() {
  try {
    localStorage.removeItem(STORAGE_FEEDBACK_LOG);
  } catch {
    // ignore
  }
}
