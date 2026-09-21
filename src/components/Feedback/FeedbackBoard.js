import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import { useAuthSession } from "../../hooks/useAuthSession";
import Spinner from "../Spinner";
import FeedbackSignInRequired from "./FeedbackSignInRequired";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackReviewersBadge from "./FeedbackReviewersBadge";
import FeedbackTimestamp from "./FeedbackTimestamp";
import FeedbackPlayerLink from "./FeedbackPlayerLink";
import { listFeedbackAll } from "../../lib/feedback/feedbackApi";
import {
  boardKeyForKind,
  boardStatusFilterChipsForKind,
  compareFeedbackItems,
  compareWishlistItems,
  countItemsByStatus,
  defaultBoardSortForKind,
  FEEDBACK_BOARD_SORT_OPTIONS,
  FEEDBACK_NEW_PATH,
  feedbackBoardSortLabelKey,
  feedbackDetailPath,
  WISHLIST_CATEGORY_FILTER_CHIPS,
  WISHLIST_SORT_OPTIONS,
} from "../../lib/feedback/feedbackConstants";
import {
  getStoredFeedbackBoardClosedOnly,
  getStoredFeedbackBoardSort,
  setStoredFeedbackBoardClosedOnly,
  setStoredFeedbackBoardSort,
} from "../../lib/feedback/feedbackListSort";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import FeedbackQuickSearch from "./FeedbackQuickSearch";
import FeedbackTagBadges from "./FeedbackTagBadges";
import { filterFeedbackItemsByQuery } from "../../lib/feedback/filterFeedbackItemsByQuery";
import { loadFeedbackTagVocab, tagOptionsForKind } from "../../lib/feedback/feedbackTagVocab";
import "./feedback.css";

function FeedbackBoard({ kind = "bug" }) {
  const { t } = useTranslation();
  const { status } = useAuthSession();
  const loggedIn = status === "ready";
  const globalMe = useStore((state) => state.globalMe);
  const boardKey = boardKeyForKind(kind);
  const defaultSort = defaultBoardSortForKind(kind);
  const statusChips = boardStatusFilterChipsForKind(kind);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [tagVocab, setTagVocab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClosedOnly, setShowClosedOnly] = useState(() => getStoredFeedbackBoardClosedOnly(kind));
  const isAdmin = Boolean(globalMe?.admin);
  const [sortBy, setSortBy] = useState(() => getStoredFeedbackBoardSort(kind, { isAdmin }));

  useEffect(() => {
    setSortBy(getStoredFeedbackBoardSort(kind, { isAdmin }));
    setShowClosedOnly(getStoredFeedbackBoardClosedOnly(kind));
    setStatusFilter("");
    setCategoryFilter("");
    setTagFilter("");
  }, [isAdmin, kind]);

  useEffect(() => {
    if (kind !== "bug" && kind !== "feature") {
      setTagVocab(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await loadFeedbackTagVocab();
      if (!cancelled && result.ok) {
        setTagVocab(result.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const handleClosedOnlyToggle = () => {
    setShowClosedOnly((prev) => {
      const next = !prev;
      setStoredFeedbackBoardClosedOnly(kind, next);
      if (next) {
        setStatusFilter("");
        setCategoryFilter("");
        setTagFilter("");
      }
      return next;
    });
  };

  const handleSortByChange = (nextSort) => {
    setSortBy(nextSort);
    setStoredFeedbackBoardSort(kind, nextSort);
  };
  const listSort = (kind === "bug" || kind === "feature")
    && FEEDBACK_BOARD_SORT_OPTIONS.includes(sortBy)
    ? sortBy
    : defaultSort;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await listFeedbackAll({
        kind,
        sort: kind === "wishlist" ? defaultSort : listSort,
        limit: 100,
        closedOnly: showClosedOnly,
      });
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
  }, [kind, defaultSort, listSort, showClosedOnly]);

  const statusCounts = useMemo(
    () => countItemsByStatus(items, statusChips),
    [items, statusChips],
  );

  const categoryCounts = useMemo(() => {
    if (kind !== "wishlist") {
      return {};
    }
    const counts = {};
    for (const chip of WISHLIST_CATEGORY_FILTER_CHIPS) {
      counts[chip] = items.filter((item) => item.wishlistCategory === chip).length;
    }
    return counts;
  }, [items, kind]);

  const tagOptions = useMemo(
    () => tagOptionsForKind(tagVocab, kind),
    [kind, tagVocab],
  );

  const tagCounts = useMemo(() => {
    if (kind !== "bug" && kind !== "feature") {
      return {};
    }
    const counts = {};
    for (const entry of tagOptions) {
      counts[entry.id] = items.filter((item) => Array.isArray(item.tags) && item.tags.includes(entry.id)).length;
    }
    return counts;
  }, [items, kind, tagOptions]);

  const displayItems = useMemo(() => {
    let filtered = items;
    if (!showClosedOnly && statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    if (!showClosedOnly && kind === "wishlist" && categoryFilter) {
      filtered = filtered.filter((item) => item.wishlistCategory === categoryFilter);
    }
    if (!showClosedOnly && tagFilter && (kind === "bug" || kind === "feature")) {
      filtered = filtered.filter((item) => Array.isArray(item.tags) && item.tags.includes(tagFilter));
    }
    if (kind === "wishlist") {
      return [...filtered].sort((a, b) => compareWishlistItems(a, b, sortBy));
    }
    if (kind === "bug" || kind === "feature") {
      if (FEEDBACK_BOARD_SORT_OPTIONS.includes(sortBy) || (isAdmin && sortBy !== "default")) {
        return [...filtered].sort((a, b) => compareFeedbackItems(a, b, sortBy));
      }
    }
    return filtered;
  }, [categoryFilter, isAdmin, items, kind, showClosedOnly, sortBy, statusFilter, tagFilter]);

  const visibleItems = useMemo(
    () => filterFeedbackItemsByQuery(displayItems, searchQuery),
    [displayItems, searchQuery],
  );

  const sortOptions = kind === "wishlist"
    ? WISHLIST_SORT_OPTIONS
    : FEEDBACK_BOARD_SORT_OPTIONS;

  const sortLabelKey = (option) => (
    kind === "wishlist"
      ? `feedback.wishlist.sort${option.charAt(0).toUpperCase()}${option.slice(1)}`
      : feedbackBoardSortLabelKey(option)
  );

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
        {loggedIn ? (
          <Link className="button apButton" to={`${FEEDBACK_NEW_PATH}?kind=${kind}`}>
            {t(`feedback.${boardKey}.report`)}
          </Link>
        ) : (
          <FeedbackSignInRequired messageKey="feedback.auth.signInToCreateShort" compact />
        )}
      </p>
      <FeedbackQuickSearch value={searchQuery} onChange={setSearchQuery} />
      <div className="feedback-board-toolbar">
        <div className="feedback-board-toolbar-row">
          <div className="feedback-board-chips" role="toolbar" aria-label={t("feedback.board.filterLabel")}>
            <button
              type="button"
              className={`button is-small apButtonNeutral${!showClosedOnly && !statusFilter && !categoryFilter && !tagFilter ? " is-selected" : ""}`}
              disabled={showClosedOnly}
              onClick={() => {
                setStatusFilter("");
                setCategoryFilter("");
                setTagFilter("");
              }}
            >
              {t("feedback.board.filterAll", { count: statusCounts.all })}
            </button>
            {statusChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`button is-small apButtonNeutral${statusFilter === chip ? " is-selected" : ""}`}
                disabled={showClosedOnly}
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter(chip);
                }}
              >
                {t(`feedback.status.${chip}`)}
                {statusCounts[chip] > 0 ? ` (${statusCounts[chip]})` : ""}
              </button>
            ))}
            {kind === "wishlist" ? WISHLIST_CATEGORY_FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`button is-small apButtonNeutral${categoryFilter === chip ? " is-selected" : ""}`}
                disabled={showClosedOnly}
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter(chip);
                }}
              >
                {t(`feedback.wishlist.category.${chip}`)}
                {categoryCounts[chip] > 0 ? ` (${categoryCounts[chip]})` : ""}
              </button>
            )) : null}
            <button
              type="button"
              className={`button is-small apButtonNeutral feedback-board-closed-toggle${showClosedOnly ? " is-selected" : ""}`}
              aria-pressed={showClosedOnly}
              onClick={handleClosedOnlyToggle}
            >
              {t("feedback.board.showClosed")}
            </button>
          </div>
          <div className="field feedback-board-sort">
            <label className="label" htmlFor="feedback-board-sort">{t("feedback.board.sortBy")}</label>
            <div className="control">
              <div className="select is-small">
                <select
                  id="feedback-board-sort"
                  value={sortBy}
                  onChange={(e) => handleSortByChange(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(sortLabelKey(option))}
                    </option>
                  ))}
                  {isAdmin && kind !== "wishlist" ? (
                    <>
                      <option value="default">{t("feedback.admin.sortDefault")}</option>
                      <option value="priority">{t("feedback.admin.sortPriority")}</option>
                      <option value="status">{t("feedback.admin.sortStatus")}</option>
                    </>
                  ) : null}
                </select>
              </div>
            </div>
          </div>
        </div>
        {(kind === "bug" || kind === "feature") && tagOptions.length > 0 ? (
          <div
            className="feedback-board-chips feedback-board-tag-chips"
            role="toolbar"
            aria-label={t("feedback.board.tagFilterLabel")}
          >
            {tagOptions.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`button is-small apButtonNeutral feedback-tag-filter-chip${tagFilter === entry.id ? " feedback-tag-filter-chip--selected" : ""}`}
                disabled={showClosedOnly || tagCounts[entry.id] === 0}
                aria-pressed={tagFilter === entry.id}
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
                  setTagFilter((prev) => (prev === entry.id ? "" : entry.id));
                }}
              >
                {t(`feedback.tag.${entry.id}`, { defaultValue: entry.id })}
                {tagCounts[entry.id] > 0 ? ` (${tagCounts[entry.id]})` : ""}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error && <p className="has-text-danger">{error}</p>}
      {visibleItems.length === 0 ? (
        <p className="feedback-muted">
          {searchQuery.trim()
            ? t("feedback.search.noMatches")
            : (showClosedOnly ? t("feedback.board.emptyClosed") : t(`feedback.${boardKey}.empty`))}
        </p>
      ) : (
        <ul className="feedback-board-list">
          {visibleItems.map((item) => (
            <li key={item.id} className={`feedback-board-item${kind === "wishlist" ? " feedback-board-item-wishlist" : ""}`}>
              {kind === "wishlist" && item.coverImageUrl ? (
                <a
                  href={item.coverImageUrl}
                  className="feedback-wishlist-cover-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    className="feedback-wishlist-cover-thumb"
                    loading="lazy"
                  />
                </a>
              ) : null}
              <div className="feedback-board-item-main">
              <FeedbackStatusBadge
                status={item.status}
                effort={item.effort}
                priority={item.priority}
                wishlistCategory={item.wishlistCategory}
              />
              {(kind === "bug" || kind === "feature") ? (
                <FeedbackReviewersBadge reviewers={item.reviewers} compact />
              ) : null}
              {(kind === "bug" || kind === "feature") ? (
                <FeedbackTagBadges tags={item.tags} compact />
              ) : null}
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
                <FeedbackPlayerLink userId={item.authorId} name={item.authorName} />
                {" · "}
                {t("feedback.meta.posted")} <FeedbackTimestamp date={item.createdAt} />
                {" · "}
                {t("feedback.meta.votes", { count: item.effectiveVotes })}
                {" · "}
                {t("feedback.meta.comments", { count: item.commentCount ?? 0 })}
                {item.legacyVoteCount > 0 ? (
                  <>
                    {" · "}
                    {t("feedback.wishlist.legacyVotesNote")}
                  </>
                ) : null}
              </div>
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
