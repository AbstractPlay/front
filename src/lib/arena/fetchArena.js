import { API_ENDPOINT_OPEN } from "../../config";
import { callAuthApi } from "../api";
import { parseAuthResponse } from "../parseAuthResponse";

async function postPublicQuery(query, pars = {}) {
  const res = await fetch(API_ENDPOINT_OPEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, pars }),
  });
  if (!res.ok) {
    return null;
  }
  const envelope = await res.json();
  if (typeof envelope.body === "string") {
    try {
      return JSON.parse(envelope.body);
    } catch {
      return null;
    }
  }
  return envelope;
}

export async function fetchArenaTimeControls() {
  const data = await postPublicQuery("list_arena_time_controls");
  return data?.controls ?? [];
}

export async function fetchArenaTables({ metaGame, limit } = {}) {
  const pars = {};
  if (metaGame) {
    pars.metaGame = metaGame;
  }
  if (limit !== undefined) {
    pars.limit = limit;
  }
  const data = await postPublicQuery("list_arena_tables", pars);
  return data?.tables ?? [];
}

export async function fetchArenaTable(tableId) {
  const res = await callAuthApi("get_arena_table", { tableId }, false);
  if (!res) {
    return null;
  }
  const parsed = await parseAuthResponse(res);
  return parsed.ok ? parsed.data : null;
}

/** Current user's seated arena table/game (ARENAUSER), or null. */
export async function fetchMyArenaTable() {
  const res = await callAuthApi("get_my_arena_table", {}, false);
  if (!res) {
    return null;
  }
  const parsed = await parseAuthResponse(res);
  if (!parsed.ok) {
    return null;
  }
  return parsed.data?.table ?? null;
}

export async function arenaTableAction(query, pars) {
  const res = await callAuthApi(query, pars);
  if (!res) {
    return { ok: false, error: "Not signed in" };
  }
  const parsed = await parseAuthResponse(res);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, data: parsed.data };
}

export const STORAGE_ARENA_PREFERRED_TC = "arenaPreferredTcId";
export const STORAGE_ARENA_LAST_CREATE = "arenaLastCreate";

export function readArenaPreferredTcId() {
  try {
    return localStorage.getItem(STORAGE_ARENA_PREFERRED_TC) || "";
  } catch {
    return "";
  }
}

export function writeArenaPreferredTcId(tcId) {
  try {
    if (tcId) {
      localStorage.setItem(STORAGE_ARENA_PREFERRED_TC, tcId);
    }
  } catch {
    // ignore
  }
}

/** Last game, Fischer TC, and variants used when the player successfully created an arena table. */
export function readArenaLastCreate() {
  try {
    const raw = localStorage.getItem(STORAGE_ARENA_LAST_CREATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const variants = Array.isArray(parsed.variants)
          ? parsed.variants.filter(
              (v) => typeof v === "string" && v.length > 0,
            )
          : [];
        return {
          metaGame:
            typeof parsed.metaGame === "string" ? parsed.metaGame : "",
          arenaTcId:
            typeof parsed.arenaTcId === "string" ? parsed.arenaTcId : "",
          variants,
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    metaGame: "",
    arenaTcId: readArenaPreferredTcId(),
    variants: [],
  };
}

export function writeArenaLastCreate({ metaGame, arenaTcId, variants }) {
  try {
    const variantList = Array.isArray(variants)
      ? variants.filter((v) => typeof v === "string" && v.length > 0)
      : [];
    const payload = {
      metaGame: metaGame || "",
      arenaTcId: arenaTcId || "",
      variants: variantList,
    };
    localStorage.setItem(STORAGE_ARENA_LAST_CREATE, JSON.stringify(payload));
    if (arenaTcId) {
      writeArenaPreferredTcId(arenaTcId);
    }
  } catch {
    // ignore
  }
}
