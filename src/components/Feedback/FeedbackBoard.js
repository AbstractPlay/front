import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import FeedbackListFilters from "./FeedbackListFilters";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import { listFeedback, listFeedbackAdmin, listFeedbackAll } from "../../lib/feedback/feedbackApi";
import {
  boardKeyForKind,
  compareFeedbackItems,
  compareWishlistItems,
  FEEDBACK_NEW_PATH,
  feedbackDetailPath,
  WISHLIST_CATEGORY_FILTER_CHIPS,
  WISHLIST_SORT_OPTIONS,
} from "../../lib/feedback/feedbackConstants";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import "./feedback.css";

function FeedbackBoard({ kind = "bug" }) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const boardKey = boardKeyForKind(kind);
  const defaultSort = kind === "feature" || kind === "wishlist" ? "votes" : "recent";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState(kind === "wishlist" ? "votes" : "default");

  const isAdmin = Boolean(globalMe?.admin);
  const useAdminList = isAdmin && kind !== "wishlist" && (statusFilter || priorityFilter);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = useAdminList
        ? await listFeedbackAdmin({
          kind,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          limit: 100,
        })
        : kind === "wishlist"
          ? await listFeedbackAll({ kind, sort: defaultSort, limit: 100 })
          : await listFeedback({ kind, sort: defaultSort, limit: 100 });
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setItems(result.data.items ?? []);
      setError("");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, defaultSort, useAdminList, statusFilter, priorityFilter]);

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    for (const chip of WISHLIST_CATEGORY_FILTER_CHIPS) {
      counts[chip] = items.filter((item) => item.wishlistCategory === chip).length;
    }
    return counts;
  }, [items]);

  const displayItems = useMemo(() => {
    let filtered = items;
    if (kind === "wishlist" && categoryFilter) {
      filtered = filtered.filter((item) => item.wishlistCategory === categoryFilter);
    }
    if (kind === "wishlist") {
      return [...filtered].sort((a, b) => compareWishlistItems(a, b, sortBy));
    }
    if (isAdmin && sortBy !== "default") {
      return [...filtered].sort((a, b) => compareFeedbackItems(a, b, sortBy));
    }
    return filtered;
  }, [categoryFilter, isAdmin, items, kind, sortBy]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <FeedbackPageHelmet title={t(`feedback.${boardKey}.title`)} />
      <article className="content feedback-panel">
      <h1 className="title lined">
        <span>{t(`feedback.${boardKey}.title`)}</span>
      </h1>
      <p>{t(`feedback.${boardKey}.intro`)}</p>
      {kind === "wishlist" ? (
        <p className="feedback-muted">{t("feedback.wishlist.legend")}</p>
      ) : null}
      <p>
        <Link className="button apButton" to={`${FEEDBACK_NEW_PATH}?kind=${kind}`}>
          {t(`feedback.${boardKey}.report`)}
        </Link>
      </p>
      {kind === "wishlist" ? (
        <div className="feedback-wishlist-toolbar">
          <div className="feedback-wishlist-chips" role="toolbar" aria-label={t("feedback.wishlist.filterLabel")}>
            <button
              type="button"
              className={`button is-small apButtonNeutral${categoryFilter === "" ? " is-selected" : ""}`}
              onClick={() => setCategoryFilter("")}
            >
              {t("feedback.wishlist.filterAll", { count: categoryCounts.all })}
            </button>
            {WISHLIST_CATEGORY_FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`button is-small apButtonNeutral${categoryFilter === chip ? " is-selected" : ""}`}
                onClick={() => setCategoryFilter(chip)}
              >
                {t(`feedback.wishlist.category.${chip}`)}
                {categoryCounts[chip] > 0 ? ` (${categoryCounts[chip]})` : ""}
              </button>
            ))}
          </div>
          <div className="field feedback-wishlist-sort">
            <label className="label" htmlFor="feedback-wishlist-sort">{t("feedback.wishlist.sortBy")}</label>
            <select
              id="feedback-wishlist-sort"
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {WISHLIST_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`feedback.wishlist.sort${option.charAt(0).toUpperCase()}${option.slice(1)}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {isAdmin && kind !== "wishlist" ? (
        <div className="feedback-admin-filters">
          <FeedbackListFilters
            kind={kind}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            priority={priorityFilter}
            onPriorityChange={setPriorityFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            showSort
          />
        </div>
      ) : null}
      {error && <p className="has-text-danger">{error}</p>}
      {displayItems.length === 0 ? (
        <p className="feedback-muted">{t(`feedback.${boardKey}.empty`)}</p>
      ) : (
        <ul className="feedback-board-list">
          {displayItems.map((item) => (
            <li key={item.id} className="feedback-board-item">
              <FeedbackStatusBadge
                status={item.status}
                effort={item.effort}
                priority={item.priority}
                wishlistCategory={item.wishlistCategory}
              />
              {kind === "wishlist" && item.gameUrl ? (
                <>
                  <a
                    href={item.gameUrl}
                    className="has-text-weight-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                  </a>
                  <span className="feedback-muted">
                    {" · "}
                    <Link to={feedbackDetailPath(item.id)}>{t("feedback.wishlist.discuss")}</Link>
                  </span>
                </>
              ) : (
                <Link to={feedbackDetailPath(item.id)} className="has-text-weight-semibold">
                  {item.title}
                </Link>
              )}
              <div className="feedback-muted">
                {item.authorName} · {t("feedback.meta.votes", { count: item.effectiveVotes })}
                {" · "}
                {t("feedback.meta.comments", { count: item.commentCount ?? 0 })}
                {item.legacyVoteCount > 0 ? (
                  <>
                    {" · "}
                    {t("feedback.wishlist.legacyVotesNote")}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
    </>
  );
}

FeedbackBoard.propTypes = {
  kind: PropTypes.oneOf(["bug", "feature", "wishlist"]),
};

export default FeedbackBoard;
