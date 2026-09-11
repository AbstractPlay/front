import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Spinner from "../Spinner";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import FeedbackTimestamp from "./FeedbackTimestamp";
import { listFeedbackHistory } from "../../lib/feedback/feedbackApi";
import {
  FEEDBACK_HISTORY_TABS,
  feedbackDetailPath,
  feedbackHistoryPath,
  historyKindForTab,
} from "../../lib/feedback/feedbackConstants";
import "./feedback.css";

function FeedbackHistory() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tab = FEEDBACK_HISTORY_TABS.some((entry) => entry.id === tabParam)
    ? tabParam
    : "bugs";
  const kind = historyKindForTab(tab);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tabParam && tabParam !== tab) {
      navigate(feedbackHistoryPath(tab), { replace: true });
    }
  }, [navigate, tab, tabParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await listFeedbackHistory({ kind, limit: 100 });
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
  }, [kind]);

  function handleTabChange(nextTab) {
    navigate(feedbackHistoryPath(nextTab));
  }

  return (
    <>
      <FeedbackPageHelmet title={t("feedback.history.title")} />
      <article className="content feedback-panel">
        <h1 className="title lined">
          <span>{t("feedback.history.title")}</span>
        </h1>
        <p>{t("feedback.history.intro")}</p>
        <div className="feedback-actions" role="tablist" aria-label={t("feedback.history.tabLabel")}>
          {FEEDBACK_HISTORY_TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={`button is-small ${tab === entry.id ? "apButton" : "apButtonNeutral"}`}
              onClick={() => handleTabChange(entry.id)}
            >
              {t(`feedback.history.tabs.${entry.id}`)}
            </button>
          ))}
        </div>
        {loading ? <Spinner /> : null}
        {error ? <p className="has-text-danger">{error}</p> : null}
        {!loading && items.length === 0 ? (
          <p className="feedback-muted">{t(`feedback.history.empty.${tab}`)}</p>
        ) : null}
        {!loading && items.length > 0 ? (
          <ul className="feedback-board-list">
            {items.map((item) => (
              <li key={item.id} className="feedback-board-item">
                <span className="feedback-status-badge">
                  {t(`feedback.status.${item.terminalStatus}`, { defaultValue: item.terminalStatus })}
                </span>
                {kind === "wishlist" && item.gameUrl ? (
                  <a
                    href={item.gameUrl}
                    className="has-text-weight-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link to={feedbackDetailPath(item.id)} className="has-text-weight-semibold">
                    {item.title}
                  </Link>
                )}
                <div className="feedback-muted">
                  {item.authorName}
                  {" · "}
                  {t("feedback.meta.votes", { count: item.effectiveVotes })}
                  {" · "}
                  {t("feedback.history.closed")} <FeedbackTimestamp date={item.closedAt} />
                </div>
                {item.implementedGameMeta?.name ? (
                  <div className="feedback-muted">
                    {t("feedback.history.implementedAs", { name: item.implementedGameMeta.name })}
                  </div>
                ) : null}
                {item.resolutionNote ? (
                  <p className="feedback-history-note">{item.resolutionNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </>
  );
}

export default FeedbackHistory;
