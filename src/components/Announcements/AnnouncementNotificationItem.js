import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocalizedTimeAgo from "../LocalizedTimeAgo";

function AnnouncementNotificationItem({
  item,
  onMarkRead,
  onNavigate,
  variant = "item",
  overflowCount = 0,
}) {
  const { t } = useTranslation();

  if (variant === "more") {
    return (
      <li className="notification-panel-item notification-panel-item-new">
        <div className="notification-panel-message">
          <Link to="/news" onClick={onNavigate}>
            {t("notifications.announcementsMore", { count: overflowCount })}
          </Link>
        </div>
      </li>
    );
  }

  const ts = item.publishedAt ?? item.time;
  const title = item.title || t("News");

  return (
    <li className="notification-panel-item notification-panel-item-new">
      <div className="notification-panel-message">
        <span className="notification-panel-announcement-lead">
          {t("notifications.newAnnouncement")}
        </span>
        {" "}
        <Link to={`/news/${item.id}`} onClick={onNavigate}>
          {title}
        </Link>
      </div>
      {ts ? (
        <p className="notification-panel-time">
          <LocalizedTimeAgo date={ts} timeStyle="twitter-now" />
        </p>
      ) : null}
      <div className="notification-panel-actions">
        <Link
          to={`/news/${item.id}`}
          className="button is-small apButton"
          onClick={onNavigate}
        >
          {t("View")}
        </Link>
        &nbsp;
        <button
          type="button"
          className="button is-small is-rounded apButtonNeutral"
          onClick={() => onMarkRead(ts)}
        >
          {t("notifications.markRead")}
        </button>
      </div>
    </li>
  );
}

AnnouncementNotificationItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    publishedAt: PropTypes.number,
    time: PropTypes.number,
  }),
  onMarkRead: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["item", "more"]),
  overflowCount: PropTypes.number,
};

export default AnnouncementNotificationItem;
