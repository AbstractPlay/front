import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthSession } from "../../hooks/useAuthSession";
import Spinner from "../Spinner";
import FeedbackSignInRequired from "./FeedbackSignInRequired";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackTimestamp from "./FeedbackTimestamp";
import { listMyFeedback } from "../../lib/feedback/feedbackApi";
import { feedbackDetailPath } from "../../lib/feedback/feedbackConstants";
import { isFeedbackUnread } from "../../lib/feedback/feedbackLastSeen";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import "./feedback.css";

const TABS = [
  { id: "all", kind: undefined },
  { id: "bugs", kind: "bug" },
  { id: "ideas", kind: "feature" },
];

function FeedbackMine() {
  const { t } = useTranslation();
  const { status } = useAuthSession();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeTab = TABS.find((entry) => entry.id === tab) ?? TABS[0];

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await listMyFeedback(
        activeTab.kind ? { kind: activeTab.kind, limit: 50 } : { limit: 50 },
      );
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
  }, [activeTab.kind, status]);

  if (status === "unknown" || status === "loading") {
    return <Spinner />;
  }

  if (status !== "ready") {
    return (
      <>
        <FeedbackPageHelmet title={t("feedback.mine.title")} />
        <article className="content feedback-panel">
          <h1 className="title lined">
            <span>{t("feedback.mine.title")}</span>
          </h1>
          <FeedbackSignInRequired messageKey="feedback.auth.signInToViewMine" />
        </article>
      </>
    );
  }

  return (
    <>
      <FeedbackPageHelmet title={t("feedback.mine.title")} />
      <article className="content feedback-panel">
      <h1 className="title lined">
        <span>{t("feedback.mine.title")}</span>
      </h1>
      <p>{t("feedback.mine.intro")}</p>
      <div className="feedback-actions">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`button is-small ${tab === entry.id ? "apButton" : "apButtonNeutral"}`}
            onClick={() => setTab(entry.id)}
          >
            {t(`feedback.mine.${entry.id}`)}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : null}
      {error && <p className="has-text-danger">{error}</p>}
      {!loading && items.length === 0 ? (
        <p className="feedback-muted">{t("feedback.mine.empty")}</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <ul className="feedback-board-list">
          {items.map((item) => (
            <li key={item.id} className="feedback-board-item">
              <FeedbackStatusBadge status={item.status} effort={item.effort} />
              <Link to={feedbackDetailPath(item.id)} className="has-text-weight-semibold">
                {item.title}
              </Link>
              {isFeedbackUnread(item) ? (
                <span className="feedback-unread-badge">{t("feedback.mine.updated")}</span>
              ) : null}
              <div className="feedback-muted">
                {t("feedback.meta.posted")} <FeedbackTimestamp date={item.createdAt} />
                {" · "}
                {t(`feedback.status.${item.status}`, { defaultValue: item.status })}
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

export default FeedbackMine;
