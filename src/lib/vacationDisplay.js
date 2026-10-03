export const VACATION_BLOCKS_PER_YEAR = 14;
export const VACATION_BLOCK_MS = 86_400_000;

/**
 * @param {number | undefined} ms
 * @param {string} [locale]
 */
export function formatVacationDurationMs(ms, locale = undefined) {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) {
    return "0h";
  }
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days === 0) {
    parts.push(`${hours}h`);
  }
  return parts.join(" ");
}

/**
 * @param {number} ms
 */
export function msToDatetimeLocalValue(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {string} value from datetime-local input
 * @returns {number | undefined}
 */
export function datetimeLocalToMs(value) {
  if (!value) {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * @param {number | undefined} ms
 * @param {string} [locale]
 */
export function formatVacationDateTime(ms, locale = undefined) {
  if (ms === undefined || !Number.isFinite(ms)) {
    return "";
  }
  return new Date(ms).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Default future start for schedule form (~1 hour ahead, minute rounded). */
export function defaultFutureStartMs(now = Date.now()) {
  const d = new Date(now + 3_600_000);
  d.setSeconds(0, 0);
  return d.getTime();
}

/**
 * @typedef {Object} VacationSnapshot
 * @property {number} vacationPauseMsUsed
 * @property {number} vacationQuotaMsRemaining
 * @property {number} vacationBlocksRemaining
 * @property {number} vacationQuotaYear
 * @property {number} [vacationStartsAt]
 * @property {number} [vacationEndsAt]
 * @property {boolean} vacationOpenEnded
 * @property {boolean} vacationActive
 * @property {boolean} vacationScheduled
 */

/** @param {VacationSnapshot | undefined} snap */
export function vacationHasStint(snap) {
  return Boolean(
    snap?.vacationActive || snap?.vacationScheduled || snap?.vacationStartsAt
  );
}
