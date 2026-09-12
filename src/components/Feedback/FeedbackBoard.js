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
import FeedbackPageHelmet from "./FeedbackPageHelmet";
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
  const [sortBy, setSortBy] = useState(() => defaultBoardSortForKind(kind));

  const isAdmin = Boolean(globalMe?.admin);
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
  }, [kind, defaultSort, listSort]);

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

  const displayItems = useMemo(() => {
    let filtered = items;
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    if (kind === "wishlist" && categoryFilter) {
      filtered = filtered.filter((item) => item.wishlistCategory === categoryFilter);
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
  }, [categoryFilter, isAdmin, items, kind, sortBy, statusFilter]);

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
      <div className="feedback-board-toolbar">
        <div className="feedback-board-chips" role="toolbar" aria-label={t("feedback.board.filterLabel")}>
          <button
            type="button"
            className={`button is-small apButtonNeutral${!statusFilter && !categoryFilter ? " is-selected" : ""}`}
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
            }}
          >
            {t("feedback.board.filterAll", { count: statusCounts.all })}
          </button>
          {statusChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`button is-small apButtonNeutral${statusFilter === chip ? " is-selected" : ""}`}
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
              onClick={() => {
                setStatusFilter("");
                setCategoryFilter(chip);
              }}
            >
              {t(`feedback.wishlist.category.${chip}`)}
              {categoryCounts[chip] > 0 ? ` (${categoryCounts[chip]})` : ""}
            </button>
          )) : null}
        </div>
        <div className="field feedback-board-sort">
          <label className="label" htmlFor="feedback-board-sort">{t("feedback.board.sortBy")}</label>
          <select
            id="feedback-board-sort"
            className="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
      {error && <p className="has-text-danger">{error}</p>}
      {displayItems.length === 0 ? (
        <p className="feedback-muted">{t(`feedback.${boardKey}.empty`)}</p>
      ) : (
        <ul className="feedback-board-list">
          {displayItems.map((item) => (
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
