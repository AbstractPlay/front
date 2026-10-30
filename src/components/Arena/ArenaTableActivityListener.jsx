import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useStore } from "../../stores";
import {
  arenaTableActivityHref,
  arenaTableFromActivityDetail,
  isViewingArenaTableRoute,
} from "../../lib/arena/arenaTableActivity";
import { formatUserDisplayName } from "../Bots/botUtils";
import { readArenaTableLayoutChoice } from "./ArenaTableLayoutPicker";

function displayName(userId, users) {
  const rec = users?.[userId];
  return formatUserDisplayName(rec ? { id: userId, ...rec } : { id: userId }, users) || userId;
}

/**
 * While seated at an arena table, toast on opponent join / leave / ready when
 * the user is elsewhere in the app; clicking the toast opens the table lobby.
 * Driven by server `arena_table` WebSocket messages (see MyWebSocket).
 */
export default function ArenaTableActivityListener() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const globalMe = useStore((state) => state.globalMe);
  const users = useStore((state) => state.users);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const showEventToast = useCallback(
    (event, table) => {
      const name = displayName(event.userId, users);
      let message;
      if (event.type === "join") {
        message = t("Arena.tableActivityToast.joined", { name });
      } else if (event.type === "leave") {
        message = t("Arena.tableActivityToast.left", { name });
      } else {
        message = t("Arena.tableActivityToast.ready", { name });
      }
      const hint = t("Arena.tableActivityToast.clickHint");
      const href = arenaTableActivityHref(table, globalMe?.id, {
        layout: readArenaTableLayoutChoice(),
      });
      toast(`${message} ${hint}`, {
        style: { cursor: href ? "pointer" : undefined },
        onClick: () => {
          if (href) {
            navigate(href);
          }
        },
      });
    },
    [globalMe?.id, navigate, t, users],
  );

  useEffect(() => {
    const userId = globalMe?.id;
    if (!userId) {
      return undefined;
    }

    const onActivity = (event) => {
      const detail = event.detail ?? {};
      if (detail.userId && detail.userId !== userId) {
        return;
      }
      if (detail.actorUserId === userId) {
        return;
      }
      const table = arenaTableFromActivityDetail(detail);
      if (!table || isViewingArenaTableRoute(pathnameRef.current, table)) {
        return;
      }
      const type = detail.event;
      if (type !== "join" && type !== "leave" && type !== "ready") {
        return;
      }
      if (!detail.actorUserId) {
        return;
      }
      showEventToast({ type, userId: detail.actorUserId }, table);
      window.dispatchEvent(
        new CustomEvent("refresh-arena-table", {
          detail: { tableId: table.tableId },
        }),
      );
    };

    window.addEventListener("arena-table-activity", onActivity);
    return () => window.removeEventListener("arena-table-activity", onActivity);
  }, [globalMe?.id, showEventToast]);

  return null;
}
