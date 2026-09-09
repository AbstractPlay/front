import { API_ENDPOINT_OPEN } from "../../config";
import { callAuthApi, getAuthToken } from "../api";

const QUERY = "log_gamemove_layout_event";
const ANON_EVENTS_PER_DAY = 25;
const ANON_COUNT_KEY_PREFIX = "gameMoveLayoutEventCount-";

let sessionId;

export function getLayoutSessionId() {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

function utcDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function anonCountStorageKey(dateKey = utcDateKey()) {
  return `${ANON_COUNT_KEY_PREFIX}${dateKey}`;
}

export function getAnonymousLayoutEventCount(dateKey = utcDateKey()) {
  try {
    const raw = localStorage.getItem(anonCountStorageKey(dateKey));
    const parsed = parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return ANON_EVENTS_PER_DAY;
  }
}

function incrementAnonymousLayoutEventCount() {
  try {
    const key = anonCountStorageKey();
    localStorage.setItem(key, String(getAnonymousLayoutEventCount() + 1));
  } catch {
    // ignore quota / private browsing
  }
}

function isAnonymousCapReached() {
  return getAnonymousLayoutEventCount() >= ANON_EVENTS_PER_DAY;
}

function viewportWidth() {
  if (typeof window === "undefined") {
    return undefined;
  }
  const width = window.innerWidth;
  return Number.isFinite(width) && width > 0 ? width : undefined;
}

function buildPayload(event, fields) {
  return {
    event,
    sessionId: getLayoutSessionId(),
    viewportWidth: viewportWidth(),
    ...fields,
  };
}

async function postLayoutEvent(pars) {
  const token = await getAuthToken();
  if (token) {
    try {
      await callAuthApi(QUERY, pars, false);
    } catch {
      // Fire-and-forget: tracking must never block UI or prompt re-login.
    }
    return;
  }

  if (isAnonymousCapReached()) {
    return;
  }
  incrementAnonymousLayoutEventCount();

  try {
    await fetch(API_ENDPOINT_OPEN, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, pars }),
    });
  } catch {
    // Fire-and-forget
  }
}

/**
 * @param {{
 *   layoutId: string,
 *   resolvedFrom: string,
 *   metaGame: string,
 *   storedLayout?: string | null,
 * }} params
 */
export function trackLayoutSessionStart({
  layoutId,
  resolvedFrom,
  metaGame,
  storedLayout,
}) {
  if (!layoutId || !resolvedFrom || !metaGame) {
    return;
  }

  void postLayoutEvent(
    buildPayload("session_start", {
      layout: layoutId,
      resolvedFrom,
      metaGame,
      ...(storedLayout ? { storedLayout } : {}),
    })
  );
}

/**
 * @param {{
 *   from: string,
 *   to: string,
 *   resolvedFrom: string,
 *   metaGame: string,
 *   storedLayout?: string | null,
 * }} params
 */
export function trackLayoutSwitch({
  from,
  to,
  resolvedFrom,
  metaGame,
  storedLayout,
}) {
  if (!from || !to || from === to || !resolvedFrom || !metaGame) {
    return;
  }

  void postLayoutEvent(
    buildPayload("layout_switch", {
      layout: to,
      resolvedFrom,
      metaGame,
      from,
      to,
      ...(storedLayout ? { storedLayout } : {}),
    })
  );
}

export { ANON_EVENTS_PER_DAY };
