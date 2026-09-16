import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import AnnouncementPageHelmet from "./AnnouncementPageHelmet";
import { listAnnouncementsAdminAll } from "../../lib/announcements/announcementAdminApi";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import "./announcement.css";

function statusLabel(t, status) {
  const key = `announcements.admin.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function AnnouncementAdminList() {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!globalMe?.admin) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await listAnnouncementsAdminAll({
        status: statusFilter || undefined,
      });
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setItems([]);
      } else {
        setItems(result.data.items ?? []);
        setError("");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [globalMe?.admin, statusFilter]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [items],
  );

  if (!globalMe?.admin) {
    return <Navigate to="/news" replace />;
  }

  return (
    <>
      <AnnouncementPageHelmet title={t("announcements.admin.listTitle")} />
      <article className="content announcement-admin-panel">
        <h1 className="title lined">
          <span>{t("announcements.admin.listTitle")}</span>
        </h1>
        <p>{t("announcements.admin.listIntro")}</p>
        <div className="buttons">
          <Link to="/announcements/admin/new" className="button apButton">
            {t("announcements.admin.newDraft")}
          </Link>
          <Link to="/news" className="button apButtonNeutral">
            {t("News")}
          </Link>
        </div>
        <div className="field announcement-admin-filter">
          <label className="label" htmlFor="announcement-admin-status">
            {t("announcements.admin.filterStatus")}
          </label>
          <div className="select">
            <select
              id="announcement-admin-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("announcements.admin.allStatuses")}</option>
              <option value="draft">{statusLabel(t, "draft")}</option>
              <option value="published">{statusLabel(t, "published")}</option>
            </select>
          </div>
        </div>
        {loading ? <Spinner /> : null}
        {error ? <p className="has-text-danger">{error}</p> : null}
        {!loading && sorted.length === 0 ? (
          <p className="announcement-muted">{t("announcements.admin.empty")}</p>
        ) : null}
        {!loading && sorted.length > 0 ? (
          <table className="table is-fullwidth announcement-admin-table">
            <thead>
              <tr>
                <th>{t("announcements.admin.colTitle")}</th>
                <th>{t("announcements.admin.colStatus")}</th>
                <th>{t("announcements.admin.colUpdated")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/announcements/admin/${item.id}`}>{item.title || item.id}</Link>
                  </td>
                  <td>{statusLabel(t, item.status)}</td>
                  <td>
                    <LocalizedTimeAgo date={item.updatedAt} timeStyle="twitter-now" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </>
  );
}

export default AnnouncementAdminList;
