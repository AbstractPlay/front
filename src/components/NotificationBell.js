import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NavDropdownPanel from "./NavDropdownPanel";
import LocalizedTimeAgo from "./LocalizedTimeAgo";
import ChallengeResponseModal from "./Me/ChallengeResponseModal";
import { NotificationMessage } from "../lib/notificationMessages";
import { isNotificationNew } from "../lib/notificationStatus";
import { useUnreadNews } from "../hooks/useUnreadNews";
import { useDismissNotification } from "../hooks/useDismissNotification";
import { useDismissAllNotifications } from "../hooks/useDismissAllNotifications";
import { useMarkNotificationsSeen } from "../hooks/useMarkNotificationsSeen";
import { useChallengeResponse } from "../hooks/useChallengeResponse";
import { fetchDashboard, fetchNotifications } from "../lib/globalMeBootstrap";
import { useStore } from "../stores";

function NotificationBell({ closeBurger }) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const { hasUnreadNews } = useUnreadNews();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChallengeModal, setActiveChallengeModal] = useState("");
  const [dismissAllConfirming, setDismissAllConfirming] = useState(false);

  const handleDismiss = useDismissNotification();
  const dismissAllNotifications = useDismissAllNotifications();
  const markNotificationsSeen = useMarkNotificationsSeen();

  const handleChallengeResponse = useChallengeResponse({
    onSuccess: async () => {
      await fetchDashboard();
      setActiveChallengeModal("");
    },
  });

  const notifications = useMemo(() => {
    const list = globalMe?.notifications ?? [];
    return [...list].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [globalMe?.notifications]);

  const newCount = useMemo(
    () => notifications.filter(isNotificationNew).length,
    [notifications]
  );

  useEffect(() => {
    if (globalMe?.id && globalMe.notifications === undefined) {
      fetchNotifications();
    }
  }, [globalMe?.id, globalMe?.notifications]);

  const challengeById = useMemo(() => {
    const map = new Map();
    for (const c of globalMe?.challengesReceived ?? []) {
      map.set(c.id, c);
    }
    return map;
  }, [globalMe?.challengesReceived]);

  if (globalMe === null) {
    return null;
  }

  const showBadge = newCount > 0 || hasUnreadNews;
  const badgeLabel =
    newCount > 0
      ? newCount > 9
        ? "9+"
        : String(newCount)
      : hasUnreadNews
        ? "1"
        : "";

  const closeMenu = () => {
    setDismissAllConfirming(false);
    setMenuOpen(false);
  };

  const handleDismissAllClick = async () => {
    if (!dismissAllConfirming) {
      setDismissAllConfirming(true);
      return;
    }
    setDismissAllConfirming(false);
    await dismissAllNotifications();
  };

  const handleNewsClick = () => {
    closeMenu();
    if (closeBurger) {
      closeBurger();
    }
  };

  return (
    <NavDropdownPanel open={menuOpen} onClose={closeMenu}>
      <button
        type="button"
        className="nav-icon-btn notification-bell-btn"
        aria-label={t("a11y.notifications")}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="icon">
          <i className="fa fa-bell" aria-hidden="true"></i>
        </span>
        {showBadge ? (
          <span className="notification-bell-badge" aria-live="polite">
            {badgeLabel}
          </span>
        ) : null}
      </button>
      {menuOpen ? (
        <div
          className="nav-dropdown-panel notification-panel"
          role="menu"
          aria-label={t("a11y.notifications")}
        >
          {hasUnreadNews ? (
            <Link
              to="/news"
              className="notification-panel-news-callout"
              role="menuitem"
              onClick={handleNewsClick}
            >
              {t("notifications.newsUpdated")}
            </Link>
          ) : null}
          {newCount > 0 ? (
            <div className="notification-panel-toolbar notification-panel-toolbar-top">
              <button
                type="button"
                className="button is-small is-rounded apButtonNeutral notification-panel-bulk-btn"
                onClick={() => markNotificationsSeen()}
              >
                {t("notifications.markAllRead")}
              </button>
            </div>
          ) : null}
          {notifications.length === 0 && !hasUnreadNews ? (
            <p className="notification-panel-empty">{t("notifications.empty")}</p>
          ) : null}
          {notifications.length > 0 ? (
            <>
            <ul className="notification-panel-list">
              {notifications.map((n) => {
                const note =
                  n.body.note && String(n.body.note).trim() !== ""
                    ? n.body.note
                    : "";
                const body = n.body;
                const isNew = isNotificationNew(n);
                const markReadButton = isNew ? (
                  <>
                    <button
                      type="button"
                      className="button is-small is-rounded apButtonNeutral"
                      onClick={() => markNotificationsSeen({ sks: [n.sk] })}
                    >
                      {t("notifications.markRead")}
                    </button>
                    &nbsp;
                  </>
                ) : null;
                const dismissButton = (
                  <button
                    type="button"
                    className="button is-small is-rounded apButtonNeutral"
                    onClick={() => handleDismiss(n.sk)}
                  >
                    {t("me.notifications.dismiss")}
                  </button>
                );

                let actions = (
                  <>
                    {markReadButton}
                    {dismissButton}
                  </>
                );
                if (body.type === "challengeIssued") {
                  const challenge = challengeById.get(body.challengeId);
                  actions = (
                    <>
                      {challenge ? (
                        <>
                          <ChallengeResponseModal
                            challenge={challenge}
                            show={
                              activeChallengeModal !== "" &&
                              activeChallengeModal === body.challengeId
                            }
                            close={() => setActiveChallengeModal("")}
                            respond={handleChallengeResponse}
                          />
                          <button
                            type="button"
                            className="button is-small apButton"
                            onClick={() =>
                              setActiveChallengeModal(body.challengeId)
                            }
                          >
                            {t("View")}
                          </button>
                          &nbsp;
                        </>
                      ) : null}
                      {markReadButton}
                      {dismissButton}
                    </>
                  );
                }

                const itemClassName = isNew
                  ? "notification-panel-item notification-panel-item-new"
                  : "notification-panel-item";

                return (
                  <li key={n.sk} className={itemClassName}>
                    <div className="notification-panel-message">
                      <NotificationMessage body={body} />
                    </div>
                    {note ? (
                      <span className="notificationNote">{note}</span>
                    ) : null}
                    {n.createdAt ? (
                      <p className="notification-panel-time">
                        <LocalizedTimeAgo
                          date={n.createdAt}
                          timeStyle="twitter-now"
                        />
                      </p>
                    ) : null}
                    <div className="notification-panel-actions">{actions}</div>
                  </li>
                );
              })}
            </ul>
            <div className="notification-panel-toolbar notification-panel-toolbar-bottom">
              <button
                type="button"
                className={`button is-small is-rounded notification-panel-bulk-btn${
                  dismissAllConfirming
                    ? " apButtonAlert notification-panel-bulk-btn-confirm"
                    : " apButtonNeutral"
                }`}
                onClick={handleDismissAllClick}
              >
                {dismissAllConfirming
                  ? t("notifications.dismissAllConfirm")
                  : t("notifications.dismissAll")}
              </button>
            </div>
            </>
          ) : null}
        </div>
      ) : null}
    </NavDropdownPanel>
  );
}

export default NotificationBell;
