import { formatVacationDurationMs } from "./vacationDisplay";

/**
 * @param {import("./vacationDisplay").VacationSnapshot | Record<string, unknown>} vacation
 * @param {(key: string, opts?: object) => string} t
 * @param {string} [locale]
 */
export function buildPlayerVacationTooltip(vacation, t, locale = undefined) {
  if (!vacation) {
    return "";
  }
  if (vacation.vacationScheduled && !vacation.vacationActive) {
    if (vacation.vacationStartsAt) {
      return t("vacation.profileTooltipScheduled", {
        when: new Date(vacation.vacationStartsAt).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    }
    return t("vacation.statusScheduled");
  }
  if (vacation.vacationActive || vacation.onVacation) {
    if (vacation.vacationOpenEnded) {
      const remaining = formatVacationDurationMs(
        vacation.vacationQuotaMsRemaining,
        locale
      );
      const blocks = Math.max(0, Math.floor(vacation.vacationBlocksRemaining ?? 0));
      return t("vacation.profileTooltipOpenEnded", { remaining, blocks });
    }
    if (vacation.vacationEndsAt) {
      return t("vacation.profileTooltipUntil", {
        when: new Date(vacation.vacationEndsAt).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    }
    return t("OnVacation");
  }
  return "";
}
