import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";

const STORAGE_PREFIX = "arenaFbDismissed:";

function dismissedKey(metaGame, gameId) {
  return `${STORAGE_PREFIX}${metaGame}:${gameId}`;
}

function likertOptions(t, prefix) {
  return [1, 2, 3, 4, 5].map((n) => ({
    value: n,
    label: t(`${prefix}_${n}`),
  }));
}

/**
 * Optional post-game soak survey (once per player per game).
 */
export default function ArenaFeedbackModal({ game, metaGame, gameId }) {
  const { t } = useTranslation();
  const [show, showSetter] = useState(false);
  const [clockFairness, setClockFairness] = useState(3);
  const [responsiveness, setResponsiveness] = useState(3);
  const [tcFit, setTcFit] = useState(3);
  const [unfairFlag, setUnfairFlag] = useState("na");
  const [queueAgain, setQueueAgain] = useState("maybe");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!game?.gameOver || !metaGame || !gameId) {
      showSetter(false);
      return;
    }
    try {
      if (sessionStorage.getItem(dismissedKey(metaGame, gameId))) {
        return;
      }
    } catch {
      /* ignore */
    }
    showSetter(true);
  }, [game?.gameOver, metaGame, gameId]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(dismissedKey(metaGame, gameId), "1");
    } catch {
      /* ignore */
    }
    showSetter(false);
  }, [metaGame, gameId]);

  const submit = useCallback(async () => {
    setBusy(true);
    try {
      const res = await callAuthApi("submit_arena_feedback", {
        metaGame,
        gameId,
        clockFairness,
        responsiveness,
        tcFit,
        unfairFlag,
        queueAgain,
        comment: comment.trim() || undefined,
      });
      if (!res) {
        return;
      }
      const parsed = await parseAuthResponse(res);
      if (parsed.ok) {
        setSubmitted(true);
        dismiss();
      }
    } finally {
      setBusy(false);
    }
  }, [
    metaGame,
    gameId,
    clockFairness,
    responsiveness,
    tcFit,
    unfairFlag,
    queueAgain,
    comment,
    dismiss,
  ]);

  const fairnessOpts = useMemo(
    () => likertOptions(t, "Arena.feedback.likert"),
    [t]
  );

  if (!show || submitted) {
    return null;
  }

  return (
    <Modal
      show={show}
      title={t("Arena.feedback.title")}
      disableBackdropClose
      buttons={[
        {
          label: t("Arena.feedback.submit"),
          action: submit,
          disabled: busy,
        },
        {
          label: t("Arena.feedback.dismiss"),
          action: dismiss,
        },
      ]}
    >
      <p className="help">{t("Arena.feedback.intro")}</p>
      <LikertField
        label={t("Arena.feedback.clockFairness")}
        value={clockFairness}
        onChange={setClockFairness}
        options={fairnessOpts}
      />
      <LikertField
        label={t("Arena.feedback.responsiveness")}
        value={responsiveness}
        onChange={setResponsiveness}
        options={fairnessOpts}
      />
      <LikertField
        label={t("Arena.feedback.tcFit")}
        value={tcFit}
        onChange={setTcFit}
        options={fairnessOpts}
      />
      <div className="field">
        <label className="label">{t("Arena.feedback.unfairFlag")}</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={unfairFlag}
              onChange={(e) => setUnfairFlag(e.target.value)}
            >
              <option value="na">{t("Arena.feedback.unfairNa")}</option>
              <option value="no">{t("Arena.feedback.unfairNo")}</option>
              <option value="yes">{t("Arena.feedback.unfairYes")}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label">{t("Arena.feedback.queueAgain")}</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={queueAgain}
              onChange={(e) => setQueueAgain(e.target.value)}
            >
              <option value="yes">{t("Arena.feedback.queueYes")}</option>
              <option value="maybe">{t("Arena.feedback.queueMaybe")}</option>
              <option value="no">{t("Arena.feedback.queueNo")}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label">{t("Arena.feedback.comment")}</label>
        <div className="control">
          <textarea
            className="textarea is-small"
            maxLength={500}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function LikertField({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
