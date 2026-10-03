import { callAuthApi } from "./api";
import { useStore } from "../stores";

/** @typedef {import("./vacationDisplay.js").VacationSnapshot} VacationSnapshot */

/**
 * @param {Response | undefined} res
 * @returns {Promise<{ ok: true, vacation: VacationSnapshot } | { ok: false, code?: string, error?: string }>}
 */
export async function parseVacationMutationResponse(res) {
  if (!res) {
    return { ok: false, error: "not_authenticated" };
  }
  let result;
  try {
    result = await res.json();
  } catch {
    return { ok: false, error: "invalid_response" };
  }
  if (result.statusCode === 400) {
    try {
      const body = JSON.parse(result.body);
      if (typeof body?.message === "string") {
        return { ok: false, code: body.message };
      }
    } catch {
      // fall through
    }
    return { ok: false, error: "vacation_rejected" };
  }
  if (result.statusCode !== 200) {
    return { ok: false, error: "request_failed" };
  }
  try {
    const body = JSON.parse(result.body);
    if (body?.vacation) {
      return { ok: true, vacation: body.vacation };
    }
  } catch {
    return { ok: false, error: "invalid_response" };
  }
  return { ok: false, error: "invalid_response" };
}

/** @param {VacationSnapshot} vacation */
export function applyVacationSnapshotToStore(vacation) {
  useStore.getState().setGlobalMe((prev) =>
    prev ? { ...prev, vacation } : prev
  );
}

/**
 * @param {{ startsAt: number, openEnded: boolean, endsAt?: number }} pars
 */
export async function scheduleVacation(pars) {
  const res = await callAuthApi("schedule_vacation", pars);
  const parsed = await parseVacationMutationResponse(res);
  if (parsed.ok) {
    applyVacationSnapshotToStore(parsed.vacation);
  }
  return parsed;
}

/**
 * @param {{ startsAt?: number, openEnded?: boolean, endsAt?: number | null }} pars
 */
export async function updateVacation(pars) {
  const res = await callAuthApi("update_vacation", pars);
  const parsed = await parseVacationMutationResponse(res);
  if (parsed.ok) {
    applyVacationSnapshotToStore(parsed.vacation);
  }
  return parsed;
}

export async function stopVacation() {
  const res = await callAuthApi("stop_vacation", {});
  const parsed = await parseVacationMutationResponse(res);
  if (parsed.ok) {
    applyVacationSnapshotToStore(parsed.vacation);
  }
  return parsed;
}
