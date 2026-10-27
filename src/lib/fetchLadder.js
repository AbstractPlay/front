import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "./api";
import { resolveAuthSession } from "./authSession";
import { parseAuthResponse } from "./parseAuthResponse";

export async function fetchLadderDetail(ladderId) {
  const session = await resolveAuthSession();
  if (session.status === "ready") {
    const res = await callAuthApi("get_ladder", { ladderId }, false);
    if (res) {
      const parsed = await parseAuthResponse(res);
      if (parsed.ok) {
        return parsed.data;
      }
    }
  }

  const url = new URL(API_ENDPOINT_OPEN);
  url.searchParams.append("query", "get_ladder");
  url.searchParams.append("ladderId", ladderId);
  const res = await fetch(url);
  if (res.status !== 200) {
    return null;
  }
  return res.json();
}

export async function fetchLaddersList({ metaGame, status } = {}) {
  const url = new URL(API_ENDPOINT_OPEN);
  url.searchParams.append("query", "get_ladders");
  if (metaGame) {
    url.searchParams.append("metaGame", metaGame);
  }
  if (status) {
    url.searchParams.append("status", status);
  }
  const res = await fetch(url);
  if (res.status !== 200) {
    return [];
  }
  const data = await res.json();
  return data.ladders ?? [];
}

/** Active ladder rows for a player profile (public board lookup). */
export async function fetchPlayerLadderRows(userId) {
  if (!userId) {
    return [];
  }
  const list = await fetchLaddersList();
  const rows = [];
  for (const item of list) {
    if (!(item.activeMemberIds ?? []).includes(userId)) {
      continue;
    }
    const detail = await fetchLadderDetail(item.ladderId);
    const boardRow = detail?.board?.find((r) => r.userid === userId);
    if (!boardRow) {
      continue;
    }
    rows.push({
      ladderId: item.ladderId,
      displayName: item.displayName,
      rank: boardRow.rank,
      points: boardRow.points,
    });
  }
  return rows;
}
