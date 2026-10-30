import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";
import { arenaTablePath } from "../../lib/arena/arenaRoutes";

/**
 * Seated-player control to roll back a half-started arena launch to the table lobby.
 */
export default function ArenaLaunchSyncAbort({ metaGame, tableId, className = "" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAbort = async () => {
    if (!tableId || busy) {
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await callAuthApi("abort_arena_launch_sync", { tableId });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        throw new Error(parsed.error ?? t("Arena.abortLaunchSyncFailed"));
      }
      const meta = parsed.data?.metaGame ?? metaGame;
      navigate(arenaTablePath(meta, tableId));
    } catch (e) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`arena-launch-sync-abort ${className}`.trim()}>
      <p className="arena-launch-sync-abort__notice">{t("Arena.syncStallNotice")}</p>
      <button
        type="button"
        className="button apButtonNeutral arena-launch-sync-abort__btn"
        disabled={busy}
        onClick={() => void handleAbort()}
      >
        {busy ? t("Arena.abortLaunchSyncWorking") : t("Arena.abortLaunchSync")}
      </button>
      {error ? (
        <p className="help has-text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
