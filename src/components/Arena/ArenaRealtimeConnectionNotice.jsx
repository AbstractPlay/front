import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import { useRealtimeConnectionReady } from "../../hooks/useRealtimeConnectionReady";
import { wsConnectionNoticeVariant } from "../../lib/wsConnection";

function variantMessageKey(variant) {
  if (variant === "connecting") {
    return "Arena.realtimeConnection.connecting";
  }
  if (variant === "offline") {
    return "Arena.realtimeConnection.offline";
  }
  return "Arena.realtimeConnection.reconnecting";
}

export default function ArenaRealtimeConnectionNotice({ className = "" }) {
  const { t } = useTranslation();
  const { wsConnection } = useRealtimeConnectionReady();
  const globalMe = useStore((state) => state.globalMe);
  const variant = wsConnectionNoticeVariant(wsConnection);

  if (!variant) {
    return null;
  }

  const handleReconnect = () => {
    window.dispatchEvent(new CustomEvent("ws-force-reconnect"));
  };

  const showLogin = variant === "offline" && !globalMe;

  return (
    <div
      className={`arena-realtime-connection ${className}`.trim()}
      role="alert"
    >
      <p className="arena-realtime-connection__text">
        {t(variantMessageKey(variant))}
      </p>
      <div className="arena-realtime-connection__actions">
        {showLogin ? (
          <Link className="button is-small apButton" to="/account/login">
            {t("Arena.realtimeConnection.signIn")}
          </Link>
        ) : (
          <button
            type="button"
            className="button is-small apButtonNeutral"
            onClick={handleReconnect}
          >
            {t("Arena.realtimeConnection.reconnectNow")}
          </button>
        )}
      </div>
    </div>
  );
}