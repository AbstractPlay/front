import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import FeedbackListFilters from "./FeedbackListFilters";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackTimestamp from "./FeedbackTimestamp";
import FeedbackPlayerLink from "./FeedbackPlayerLink";
import { listFeedbackAdminAll, fetchFeedbackTagVocabAuth, setFeedbackTagVocab } from "../../lib/feedback/feedbackApi";
import { invalidateFeedbackTagVocabCache } from "../../lib/feedback/feedbackTagVocab";
import {
  compareFeedbackItems,
  EFFORT_LEVELS,
  feedbackDetailPath,
} from "../../lib/feedback/feedbackConstants";
import {
  getStoredFeedbackAdminSort,
  setStoredFeedbackAdminSort,
} from "../../lib/feedback/feedbackListSort";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import FeedbackQuickSearch from "./FeedbackQuickSearch";
import { filterFeedbackItemsByQuery } from "../../lib/feedback/filterFeedbackItemsByQuery";
import "./feedback.css";

function FeedbackAdmin() {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const [kind, setKind] = useState("feature");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [effort, setEffort] = useState("");
  const [sortBy, setSortBy] = useState(() => getStoredFeedbackAdminSort(kind));
  const [needsResponse, setNeedsResponse] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [vocabEntries, setVocabEntries] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(true);
  const [vocabSaving, setVocabSaving] = useState(false);
  const [vocabError, setVocabError] = useState("");
  const [vocabMessage, setVocabMessage] = useState("");

  useEffect(() => {
    if (!globalMe?.admin) {
      return;
    }
    let cancelled = false;
    (async () => {
      setVocabLoading(true);
      const result = await fetchFeedbackTagVocabAuth();
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setVocabEntries(result.data?.tags ?? []);
        setVocabError("");
      } else {
        setVocabError(result.error);
      }
      setVocabLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [globalMe?.admin]);

  useEffect(() => {
    setSortBy(getStoredFeedbackAdminSort(kind));
  }, [kind]);

  const handleSortByChange = (nextSort) => {
    setSortBy(nextSort);
    setStoredFeedbackAdminSort(kind, nextSort);
  };

  useEffect(() => {
    if (!globalMe?.admin) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await listFeedbackAdminAll({
        kind,
        status: status || undefined,
        priority: priority || undefined,
        effort: effort || undefined,
        needsResponse: needsResponse || undefined,
        limit: 100,
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

  const visibleItems = useMemo(
    () => filterFeedbackItemsByQuery(displayItems, searchQuery),
    [displayItems, searchQuery],
  );

  const pendingSuggestions = useMemo(() => {
    const seen = new Set();
    for (const item of items) {
      for (const suggestion of item.suggestedTags ?? []) {
        seen.add(suggestion);
      }
    }
    return [...seen];
  }, [items]);

  async function handleSaveVocab() {
    setVocabSaving(true);
    setVocabMessage("");
    setVocabError("");
    const result = await setFeedbackTagVocab(vocabEntries);
    setVocabSaving(false);
    if (!result.ok) {
      setVocabError(result.error);
      return;
    }
    invalidateFeedbackTagVocabCache();
    setVocabEntries(result.data?.tags ?? vocabEntries);
    setVocabMessage(t("feedback.tags.vocabSaved"));
  }

  function updateVocabEntry(index, patch) {
    setVocabEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function removeVocabEntry(index) {
    setVocabEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addVocabEntry() {
    setVocabEntries((prev) => [...prev, { id: "", kinds: ["bug", "feature"] }]);
  }

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
      <section className="feedback-vocab-admin">
        <h2 className="title is-5">{t("feedback.tags.vocabTitle")}</h2>
        <p className="feedback-muted">{t("feedback.tags.vocabIntro")}</p>
        {vocabLoading ? <Spinner /> : null}
        {vocabError ? <p className="has-text-danger">{vocabError}</p> : null}
        {vocabMessage ? <p className="feedback-muted">{vocabMessage}</p> : null}
        {!vocabLoading ? (
          <>
            <ul className="feedback-vocab-list">
              {vocabEntries.map((entry, index) => (
                <li key={`${entry.id}-${index}`} className="feedback-vocab-row">
                  <input
                    className="input"
                    value={entry.id}
                    onChange={(e) => updateVocabEntry(index, { id: e.target.value.trim().toLowerCase().replace(/\s+/g, "_") })}
                    placeholder={t("feedback.tags.vocabIdPlaceholder")}
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={entry.kinds.includes("bug")}
                      onChange={(e) => {
                        const kinds = new Set(entry.kinds);
                        if (e.target.checked) {
                          kinds.add("bug");
                        } else {
                          kinds.delete("bug");
                        }
                        updateVocabEntry(index, { kinds: [...kinds] });
                      }}
                    />
                    {t("feedback.mine.bugs")}
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={entry.kinds.includes("feature")}
                      onChange={(e) => {
                        const kinds = new Set(entry.kinds);
                        if (e.target.checked) {
                          kinds.add("feature");
                        } else {
                          kinds.delete("feature");
                        }
                        updateVocabEntry(index, { kinds: [...kinds] });
                      }}
                    />
                    {t("feedback.mine.ideas")}
                  </label>
                  <button
                    type="button"
                    className="button apButtonNeutral is-small"
                    onClick={() => removeVocabEntry(index)}
                  >
                    {t("feedback.tags.vocabRemove")}
                  </button>
                </li>
              ))}
            </ul>
            <div className="feedback-comment-actions">
              <button type="button" className="button apButtonNeutral is-small" onClick={addVocabEntry}>
                {t("feedback.tags.vocabAdd")}
              </button>
              <button
                type="button"
                className="button apButton is-small"
                disabled={vocabSaving}
                onClick={handleSaveVocab}
              >
                {vocabSaving ? t("feedback.admin.saving") : t("feedback.tags.vocabSave")}
              </button>
            </div>
          </>
        ) : null}
        {pendingSuggestions.length > 0 ? (
          <p className="feedback-muted">{t("feedback.tags.adminSuggestions", { tags: pendingSuggestions.join(", ") })}</p>
        ) : null}
      </section>
      <FeedbackQuickSearch value={searchQuery} onChange={setSearchQuery} />
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
          onSortByChange={handleSortByChange}
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
      {!loading && visibleItems.length === 0 ? (
        <p className="feedback-muted">
          {searchQuery.trim() ? t("feedback.search.noMatches") : t("feedback.admin.empty")}
        </p>
      ) : null}
      {!loading && visibleItems.length > 0 ? (
        <ul className="feedback-board-list">
          {visibleItems.map((item) => (
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
                <FeedbackPlayerLink userId={item.authorId} name={item.authorName} />
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
