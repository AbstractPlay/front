import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import FeedbackListFilters from "./FeedbackListFilters";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackTimestamp from "./FeedbackTimestamp";
import { listFeedbackAdmin } from "../../lib/feedback/feedbackApi";
import {
  compareFeedbackItems,
  EFFORT_LEVELS,
  feedbackDetailPath,
} from "../../lib/feedback/feedbackConstants";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import "./feedback.css";

function FeedbackAdmin() {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const [kind, setKind] = useState("feature");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [effort, setEffort] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [needsResponse, setNeedsResponse] = useState(false);
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
      const result = await listFeedbackAdmin({
        kind,
        status: status || undefined,
        priority: priority || undefined,
        effort: effort || undefined,
        needsResponse: needsResponse || undefined,
        limit: 50,
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
  }, [globalMe?.admin, kind, status, priority, effort, needsResponse]);

  const displayItems = useMemo(
    () => (sortBy === "default" ? items : [...items].sort((a, b) => compareFeedbackItems(a, b, sortBy))),
    [items, sortBy],
  );

  if (!globalMe?.admin) {
    return <Navigate to="/feedback/ideas" replace />;
  }

  return (
    <>
      <FeedbackPageHelmet title={t("feedback.admin.title")} />
      <article className="content feedback-panel">
      <h1 className="title lined">
        <span>{t("feedback.admin.title")}</span>
      </h1>
      <p>{t("feedback.admin.intro")}</p>
      <div className="feedback-admin-filters">
        <div className="field feedback-filter-field">
          <label className="label" htmlFor="feedback-admin-kind">{t("feedback.admin.kind")}</label>
          <select
            id="feedback-admin-kind"
            className="select"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="bug">{t("feedback.mine.bugs")}</option>
            <option value="feature">{t("feedback.mine.ideas")}</option>
          </select>
        </div>
        <FeedbackListFilters
          kind={kind}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          showSort
        />
        <div className="field feedback-filter-field">
          <label className="label" htmlFor="feedback-admin-effort">{t("feedback.admin.effort")}</label>
          <select
            id="feedback-admin-effort"
            className="select"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          >
            <option value="">{t("feedback.admin.allEfforts")}</option>
            {EFFORT_LEVELS.map((value) => (
              <option key={value} value={value}>
                {t(`feedback.effort.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <label className="checkbox feedback-admin-needs-response">
          <input
            type="checkbox"
            checked={needsResponse}
            onChange={(e) => setNeedsResponse(e.target.checked)}
          />
          {t("feedback.admin.needsResponse")}
        </label>
      </div>
      {loading ? <Spinner /> : null}
      {error && <p className="has-text-danger">{error}</p>}
      {!loading && displayItems.length === 0 ? (
        <p className="feedback-muted">{t("feedback.admin.empty")}</p>
      ) : null}
      {!loading && displayItems.length > 0 ? (
        <ul className="feedback-board-list">
          {displayItems.map((item) => (
            <li key={item.id} className="feedback-board-item">
              <FeedbackStatusBadge
                status={item.status}
                effort={item.effort}
                priority={item.priority}
              />
              {item.needsResponse ? (
                <span className="feedback-needs-response">{t("feedback.admin.needsResponse")}</span>
              ) : null}
              <Link to={feedbackDetailPath(item.id)} className="has-text-weight-semibold">
                {item.title}
              </Link>
              <div className="feedback-muted">
                {item.authorName}
                {" · "}
                {t("feedback.meta.posted")} <FeedbackTimestamp date={item.createdAt} />
                {" · "}
                {t("feedback.meta.votes", { count: item.effectiveVotes })}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
    </>
  );
}

export default FeedbackAdmin;
