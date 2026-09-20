import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import FeedbackSignInRequired from "./FeedbackSignInRequired";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackTimestamp from "./FeedbackTimestamp";
import FeedbackQuickSearch from "./FeedbackQuickSearch";
import FeedbackNewKindsPanel from "./FeedbackNewKindsPanel";
import {
  listMyFeedbackAll,
  subscribeFeedback,
  voteFeedback,
} from "../../lib/feedback/feedbackApi";
import { feedbackDetailPath } from "../../lib/feedback/feedbackConstants";
import { isFeedbackUnread } from "../../lib/feedback/feedbackLastSeen";
import { filterFeedbackItemsByQuery } from "../../lib/feedback/filterFeedbackItemsByQuery";
import { defaultFeedbackNewKinds } from "../../lib/notificationPrefs";
import { saveFeedbackNewKinds } from "../../lib/feedback/saveFeedbackNewKinds";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import "./feedback.css";

const KIND_TABS = [
  { id: "all", kind: undefined },
  { id: "bugs", kind: "bug" },
  { id: "ideas", kind: "feature" },
  { id: "wishlist", kind: "wishlist" },
];

const SCOPE_TABS = [
  { id: "submitted", scope: "submitted" },
  { id: "voted", scope: "voted" },
  { id: "watched", scope: "watched" },
];

function FeedbackMine() {
  const { t } = useTranslation();
  const { status } = useAuthSession();
  const globalMe = useStore((state) => state.globalMe);
  const [kindTab, setKindTab] = useState("all");
  const [scopeTab, setScopeTab] = useState("submitted");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState("");
  const [notifySaving, setNotifySaving] = useState(false);

  const activeKindTab = KIND_TABS.find((entry) => entry.id === kindTab) ?? KIND_TABS[0];
  const activeScopeTab = SCOPE_TABS.find((entry) => entry.id === scopeTab) ?? SCOPE_TABS[0];

  const feedbackNewKinds = useMemo(
    () => defaultFeedbackNewKinds(globalMe?.settings?.all?.feedbackNewKinds),
    [globalMe?.settings?.all?.feedbackNewKinds],
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    const result = await listMyFeedbackAll(
      activeKindTab.kind
        ? { kind: activeKindTab.kind, scope: activeScopeTab.scope, limit: 100 }
        : { scope: activeScopeTab.scope, limit: 100 },
    );
    if (!result.ok) {
      setError(result.error);
      setItems([]);
    } else {
      setItems(result.data.items ?? []);
      setError("");
    }
    setLoading(false);
  }, [activeKindTab.kind, activeScopeTab.scope]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    loadItems();
  }, [loadItems, status]);

  const displayItems = useMemo(
    () => filterFeedbackItemsByQuery(items, searchQuery),
    [items, searchQuery],
  );

  const handleUnvote = async (item) => {
    setActionError("");
    setActionId(item.id);
    const result = await voteFeedback(item.id, false);
    setActionId("");
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    await loadItems();
  };

  const handleUnwatch = async (item) => {
    setActionError("");
    setActionId(item.id);
    const result = await subscribeFeedback(item.id, false);
    setActionId("");
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    await loadItems();
  };

  const handleNotifyToggle = async (kind) => {
    if (!globalMe) {
      return;
    }
    setNotifySaving(true);
    try {
      const next = !feedbackNewKinds[kind];
      await saveFeedbackNewKinds(globalMe, kind, next);
    } catch {
      setActionError(t("feedback.mine.notifySaveError"));
    }
    setNotifySaving(false);
  };

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

  const emptyKey = `feedback.mine.empty_${activeScopeTab.id}`;

  return (
    <>
      <FeedbackPageHelmet title={t("feedback.mine.title")} />
      <article className="content feedback-panel">
        <h1 className="title lined">
          <span>{t("feedback.mine.title")}</span>
        </h1>
        <p>{t(`feedback.mine.intro_${activeScopeTab.id}`)}</p>

        <FeedbackNewKindsPanel
          kinds={feedbackNewKinds}
          onToggle={handleNotifyToggle}
          saving={notifySaving}
        />

        <FeedbackQuickSearch value={searchQuery} onChange={setSearchQuery} />

        <div className="feedback-actions" role="toolbar" aria-label={t("feedback.mine.scopeLabel")}>
          {SCOPE_TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`button is-small ${scopeTab === entry.id ? "apButton" : "apButtonNeutral"}`}
              onClick={() => setScopeTab(entry.id)}
            >
              {t(`feedback.mine.scope_${entry.id}`)}
            </button>
          ))}
        </div>
        <div className="feedback-actions">
          {KIND_TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`button is-small ${kindTab === entry.id ? "apButton" : "apButtonNeutral"}`}
              onClick={() => setKindTab(entry.id)}
            >
              {t(`feedback.mine.${entry.id}`)}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : null}
        {error && <p className="has-text-danger">{error}</p>}
        {actionError && <p className="has-text-danger">{actionError}</p>}
        {!loading && displayItems.length === 0 ? (
          <p className="feedback-muted">
            {searchQuery.trim()
              ? t("feedback.search.noMatches")
              : t(emptyKey, { defaultValue: t("feedback.mine.empty") })}
          </p>
        ) : null}
        {!loading && displayItems.length > 0 ? (
          <ul className="feedback-board-list">
            {displayItems.map((item) => (
              <li key={item.id} className="feedback-board-item feedback-mine-item">
                <div className="feedback-mine-item-main">
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
                </div>
                <div className="feedback-mine-item-actions">
                  {item.userVoted ? (
                    <button
                      type="button"
                      className="button is-small apButtonNeutral"
                      disabled={actionId === item.id}
                      onClick={() => handleUnvote(item)}
                    >
                      {t("feedback.mine.unvote")}
                    </button>
                  ) : null}
                  {item.subscribed ? (
                    <button
                      type="button"
                      className="button is-small apButtonNeutral"
                      disabled={actionId === item.id}
                      onClick={() => handleUnwatch(item)}
                    >
                      {t("feedback.mine.unwatch")}
                    </button>
                  ) : null}
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
