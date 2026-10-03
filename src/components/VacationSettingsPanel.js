import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Spinner from "./Spinner";
import {
  datetimeLocalToMs,
  defaultFutureStartMs,
  formatVacationDateTime,
  formatVacationDurationMs,
  msToDatetimeLocalValue,
  vacationHasStint,
  VACATION_BLOCKS_PER_YEAR,
} from "../lib/vacationDisplay";
import {
  scheduleVacation,
  stopVacation,
  updateVacation,
} from "../lib/vacationApi";

function vacationErrorMessage(t, result) {
  if (result.ok) {
    return "";
  }
  if (result.code) {
    const key = `vacation.errors.${result.code}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
    return result.code;
  }
  return t("vacation.errors.generic");
}

function VacationSettingsPanel({ vacation }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [busy, setBusy] = useState(false);
  const [startMode, setStartMode] = useState("now");
  const [scheduledStartLocal, setScheduledStartLocal] = useState(() =>
    msToDatetimeLocalValue(defaultFutureStartMs())
  );
  const [openEnded, setOpenEnded] = useState(true);
  const [endsAtLocal, setEndsAtLocal] = useState(() =>
    msToDatetimeLocalValue(defaultFutureStartMs() + 7 * 86_400_000)
  );
  const [editOpenEnded, setEditOpenEnded] = useState(true);
  const [editEndsAtLocal, setEditEndsAtLocal] = useState("");

  const snap = vacation;
  const hasStint = vacationHasStint(snap);

  useEffect(() => {
    if (!snap) {
      return;
    }
    setEditOpenEnded(snap.vacationOpenEnded === true);
    if (snap.vacationEndsAt !== undefined) {
      setEditEndsAtLocal(msToDatetimeLocalValue(snap.vacationEndsAt));
    } else {
      setEditEndsAtLocal(
        msToDatetimeLocalValue(defaultFutureStartMs() + 7 * 86_400_000)
      );
    }
  }, [snap]);

  const quotaLine = useMemo(() => {
    if (!snap) {
      return null;
    }
    const blocks = snap.vacationBlocksRemaining ?? 0;
    const remaining = formatVacationDurationMs(
      snap.vacationQuotaMsRemaining,
      locale
    );
    return t("vacation.quotaSummary", {
      blocks: Math.max(0, Math.floor(blocks)),
      maxBlocks: VACATION_BLOCKS_PER_YEAR,
      remaining,
      year: snap.vacationQuotaYear,
    });
  }, [snap, locale, t]);

  const runMutation = useCallback(async (fn) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result.ok) {
        toast.success(t("vacation.saved"));
      } else {
        toast.error(vacationErrorMessage(t, result));
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [t]);

  const handleSchedule = () => {
    const startsAt =
      startMode === "now" ? Date.now() : datetimeLocalToMs(scheduledStartLocal);
    if (startsAt === undefined) {
      toast.error(t("vacation.errors.vacation_invalid_range"));
      return;
    }
    const pars = { startsAt, openEnded: openEnded === true };
    if (!openEnded) {
      const endsAt = datetimeLocalToMs(endsAtLocal);
      if (endsAt === undefined) {
        toast.error(t("vacation.errors.vacation_invalid_range"));
        return;
      }
      pars.endsAt = endsAt;
    }
    runMutation(() => scheduleVacation(pars));
  };

  const handleStop = () => {
    runMutation(() => stopVacation());
  };

  const handleUpdate = () => {
    const pars = { openEnded: editOpenEnded === true };
    if (!editOpenEnded) {
      const endsAt = datetimeLocalToMs(editEndsAtLocal);
      if (endsAt === undefined) {
        toast.error(t("vacation.errors.vacation_invalid_range"));
        return;
      }
      pars.endsAt = endsAt;
    } else {
      pars.endsAt = null;
    }
    runMutation(() => updateVacation(pars));
  };

  if (!snap) {
    return <Spinner />;
  }

  return (
    <div className="vacation-settings">
      <p className="help mb-3">{t("vacation.intro")}</p>
      {quotaLine ? <p className="mb-3">{quotaLine}</p> : null}

      {snap.vacationActive ? (
        <div className="notification is-info is-light mb-4">
          <p className="mb-2">
            <strong>{t("vacation.statusActive")}</strong>
          </p>
          {snap.vacationStartsAt !== undefined ? (
            <p className="is-size-7 mb-1">
              {t("vacation.startedAt", {
                when: formatVacationDateTime(snap.vacationStartsAt, locale),
              })}
            </p>
          ) : null}
          {snap.vacationOpenEnded ? (
            <p className="is-size-7">{t("vacation.openEndedLabel")}</p>
          ) : snap.vacationEndsAt !== undefined ? (
            <p className="is-size-7">
              {t("vacation.endsAt", {
                when: formatVacationDateTime(snap.vacationEndsAt, locale),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {snap.vacationScheduled && !snap.vacationActive ? (
        <div className="notification is-warning is-light mb-4">
          <p className="mb-2">
            <strong>{t("vacation.statusScheduled")}</strong>
          </p>
          {snap.vacationStartsAt !== undefined ? (
            <p className="is-size-7 mb-1">
              {t("vacation.startsAt", {
                when: formatVacationDateTime(snap.vacationStartsAt, locale),
              })}
            </p>
          ) : null}
          {snap.vacationOpenEnded ? (
            <p className="is-size-7">{t("vacation.openEndedLabel")}</p>
          ) : snap.vacationEndsAt !== undefined ? (
            <p className="is-size-7">
              {t("vacation.endsAt", {
                when: formatVacationDateTime(snap.vacationEndsAt, locale),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasStint ? (
        <>
          {!snap.vacationActive && snap.vacationScheduled ? (
            <div className="field">
              <label className="label">{t("vacation.editScheduled")}</label>
              <div className="control">
                <label className="checkbox is-small mr-3">
                  <input
                    type="checkbox"
                    checked={editOpenEnded}
                    disabled={busy}
                    onChange={(e) => setEditOpenEnded(e.target.checked)}
                  />
                  {t("vacation.openEndedUntilStop")}
                </label>
              </div>
              {!editOpenEnded ? (
                <div className="control mt-2">
                  <label className="label is-size-7" htmlFor="vacation_edit_end">
                    {t("vacation.fixedEnd")}
                  </label>
                  <input
                    id="vacation_edit_end"
                    className="input is-small"
                    type="datetime-local"
                    value={editEndsAtLocal}
                    disabled={busy}
                    onChange={(e) => setEditEndsAtLocal(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="field is-grouped mt-3">
                <div className="control">
                  <button
                    type="button"
                    className="button is-small apButton"
                    disabled={busy}
                    onClick={handleUpdate}
                  >
                    {t("vacation.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {snap.vacationActive && !snap.vacationOpenEnded ? (
            <div className="field">
              <label className="label">{t("vacation.editActiveEnd")}</label>
              <div className="control">
                <input
                  className="input is-small"
                  type="datetime-local"
                  value={editEndsAtLocal}
                  disabled={busy}
                  onChange={(e) => setEditEndsAtLocal(e.target.value)}
                />
              </div>
              <div className="field is-grouped mt-2">
                <div className="control">
                  <button
                    type="button"
                    className="button is-small apButton"
                    disabled={busy}
                    onClick={() =>
                      runMutation(() =>
                        updateVacation({
                          openEnded: false,
                          endsAt: datetimeLocalToMs(editEndsAtLocal),
                        })
                      )
                    }
                  >
                    {t("vacation.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="field is-grouped">
            <div className="control">
              <button
                type="button"
                className="button is-small is-danger"
                disabled={busy}
                onClick={handleStop}
              >
                {snap.vacationScheduled && !snap.vacationActive
                  ? t("vacation.cancelScheduled")
                  : t("vacation.stopVacation")}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="field">
          <label className="label">{t("vacation.scheduleHeading")}</label>
          <div className="control mb-2">
            <label className="radio is-small mr-3">
              <input
                type="radio"
                name="vacation_start_mode"
                checked={startMode === "now"}
                disabled={busy}
                onChange={() => setStartMode("now")}
              />
              {t("vacation.startNow")}
            </label>
            <label className="radio is-small">
              <input
                type="radio"
                name="vacation_start_mode"
                checked={startMode === "future"}
                disabled={busy}
                onChange={() => setStartMode("future")}
              />
              {t("vacation.startLater")}
            </label>
          </div>
          {startMode === "future" ? (
            <div className="control mb-3">
              <input
                className="input is-small"
                type="datetime-local"
                value={scheduledStartLocal}
                disabled={busy}
                onChange={(e) => setScheduledStartLocal(e.target.value)}
              />
            </div>
          ) : null}
          <div className="control mb-2">
            <label className="checkbox is-small">
              <input
                type="checkbox"
                checked={openEnded}
                disabled={busy}
                onChange={(e) => setOpenEnded(e.target.checked)}
              />
              {t("vacation.openEndedUntilStop")}
            </label>
          </div>
          {!openEnded ? (
            <div className="control mb-3">
              <label className="label is-size-7" htmlFor="vacation_schedule_end">
                {t("vacation.fixedEnd")}
              </label>
              <input
                id="vacation_schedule_end"
                className="input is-small"
                type="datetime-local"
                value={endsAtLocal}
                disabled={busy}
                onChange={(e) => setEndsAtLocal(e.target.value)}
              />
            </div>
          ) : null}
          <div className="control">
            <button
              type="button"
              className="button is-small apButton"
              disabled={busy || snap.vacationQuotaMsRemaining <= 0}
              onClick={handleSchedule}
            >
              {t("vacation.scheduleSubmit")}
            </button>
          </div>
          {snap.vacationQuotaMsRemaining <= 0 ? (
            <p className="help is-danger mt-2">{t("vacation.noQuotaLeft")}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default VacationSettingsPanel;
