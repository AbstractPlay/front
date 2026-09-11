import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import { useAuthSession } from "../../hooks/useAuthSession";
import Spinner from "../Spinner";
import FeedbackSignInRequired from "./FeedbackSignInRequired";
import Modal from "../Modal";
import FeedbackMarkdown from "./FeedbackMarkdown";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import FeedbackReviewersBadge from "./FeedbackReviewersBadge";
import FeedbackReviewerPicker from "./FeedbackReviewerPicker";
import { fetchUserNames } from "../../lib/fetchUserNames";
import WishlistCategoryCallout from "./WishlistCategoryCallout";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import ScreenshotUpload from "./ScreenshotUpload";
import FeedbackTimestamp from "./FeedbackTimestamp";
import { markFeedbackSeen } from "../../lib/feedback/feedbackLastSeen";
import {
  commentFeedback,
  deleteFeedback,
  getFeedbackAuth,
  getFeedbackOpen,
  holdFeedbackRetention,
  setFeedbackAdminFields,
  setFeedbackStatus,
  subscribeFeedback,
  updateFeedback,
  voteFeedback,
} from "../../lib/feedback/feedbackApi";
import {
  EFFORT_LEVELS,
  PRIORITY_LEVELS,
  WISHLIST_ADMIN_CATEGORIES,
  boardKeyForKind,
  boardPathForKind,
  feedbackHistoryPath,
  historyTabForKind,
  statusesForKind,
} from "../../lib/feedback/feedbackConstants";
import "./feedback.css";

function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status } = useAuthSession();
  const loggedIn = status === "ready";
  const globalMe = useStore((state) => state.globalMe);
  const users = useStore((state) => state.users);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [notifyMe, setNotifyMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAttachmentKeys, setEditAttachmentKeys] = useState([]);
  const [adminEffort, setAdminEffort] = useState("");
  const [adminPriority, setAdminPriority] = useState("");
  const [adminTags, setAdminTags] = useState("");
  const [adminReviewerIds, setAdminReviewerIds] = useState([]);
  const [adminWishlistCategory, setAdminWishlistCategory] = useState("none");
  const [adminWishlistNote, setAdminWishlistNote] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const authResult = loggedIn
      ? await getFeedbackAuth(id)
      : await getFeedbackOpen(id);
    if (!authResult.ok) {
      setError(authResult.error);
      setData(null);
    } else {
      setData(authResult.data);
      setError("");
      const post = authResult.data.post;
      if (post) {
        setEditTitle(post.title);
        setEditBody(post.body ?? "");
        setAdminEffort(post.effort ?? "");
        setAdminPriority(post.priority ?? "");
        setAdminTags(Array.isArray(post.adminTags) ? post.adminTags.join(", ") : "");
        setAdminReviewerIds(
          Array.isArray(post.reviewers) ? post.reviewers.map((reviewer) => reviewer.id) : [],
        );
        setAdminWishlistCategory(post.wishlistCategory ?? "none");
        setAdminWishlistNote(post.wishlistCategoryNote ?? "");
        markFeedbackSeen(post.id, post.updatedAt);
      }
    }
    setLoading(false);
  }, [loggedIn, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (globalMe?.admin) {
      fetchUserNames();
    }
  }, [globalMe?.admin]);

  async function handleVote() {
    const voted = Boolean(data?.userVoted);
    const result = await voteFeedback(id, !voted);
    if (result.ok) {
      await load();
    }
  }

  async function handleSubscribe() {
    const next = !data?.subscribed;
    const result = await subscribeFeedback(id, next);
    if (result.ok) {
      setData((prev) => ({ ...prev, subscribed: result.data.subscribed }));
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    setSubmitting(true);
    const result = await commentFeedback(id, commentBody.trim(), notifyMe);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCommentBody("");
    await load();
  }

  async function handleStatusChange(e) {
    const status = e.target.value;
    const result = await setFeedbackStatus(id, status);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateFeedback({
      id,
      title: editTitle.trim(),
      body: editBody.trim(),
      attachmentKeys: editAttachmentKeys.length > 0 ? editAttachmentKeys : undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setEditAttachmentKeys([]);
    await load();
  }

  async function handleDelete() {
    const reason = deleteReason.trim();
    if (!reason) {
      return;
    }
    setSubmitting(true);
    const result = await deleteFeedback(id, reason);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setShowDeleteModal(false);
    navigate(boardPathForKind("wishlist"));
  }

  async function handleRetentionHold(hold) {
    setSubmitting(true);
    const result = await holdFeedbackRetention(id, hold);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function handleSaveAdminFields(e) {
    e.preventDefault();
    setSubmitting(true);
    const tags = adminTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const adminPars = { id };
    if (post.kind === "wishlist") {
      adminPars.wishlistCategory = adminWishlistCategory;
      adminPars.wishlistCategoryNote = adminWishlistNote.trim() || undefined;
    } else {
      adminPars.effort = adminEffort || undefined;
      adminPars.adminTags = tags.length > 0 ? tags : undefined;
      if (post.kind === "bug" || post.kind === "feature") {
        adminPars.priority = adminPriority || "";
        adminPars.reviewerIds = adminReviewerIds;
      }
    }
    const result = await setFeedbackAdminFields(adminPars);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  if (loading) {
    return <Spinner />;
  }
  if (!data?.post && !data?.summary) {
    return (
      <article className="content">
        <p className="has-text-danger">{error || t("feedback.detail.notFound")}</p>
        <Link to={boardPathForKind("bug")}>{t("feedback.bugs.backToBoard")}</Link>
      </article>
    );
  }

  if (data.purged && data.summary) {
    const summary = data.summary;
    const boardKey = boardKeyForKind(summary.kind);
    const historyTab = historyTabForKind(summary.kind);
    return (
      <>
        <FeedbackPageHelmet title={summary.title} />
        <article className="content feedback-panel">
          <p>
            <Link to={feedbackHistoryPath(historyTab)}>{t("feedback.history.viewHistory")}</Link>
          </p>
          <div className="feedback-archived-banner" role="status">
            {t("feedback.detail.archivedPurgedBanner")}
          </div>
          <h1 className="title lined">
            <span>
              {summary.kind === "wishlist" && summary.gameUrl ? (
                <a href={summary.gameUrl} target="_blank" rel="noopener noreferrer">{summary.title}</a>
              ) : (
                summary.title
              )}
            </span>
          </h1>
          <div className="feedback-muted">
            {summary.authorName}
            {" · "}
            {t(`feedback.status.${summary.terminalStatus}`, { defaultValue: summary.terminalStatus })}
            {" · "}
            {t("feedback.meta.votes", { count: summary.effectiveVotes })}
            {" · "}
            {t("feedback.history.closed")} <FeedbackTimestamp date={summary.closedAt} />
          </div>
          {summary.implementedGameMeta?.name ? (
            <p className="feedback-muted">
              {t("feedback.history.implementedAs", { name: summary.implementedGameMeta.name })}
            </p>
          ) : null}
          {summary.resolutionNote ? (
            <p>{summary.resolutionNote}</p>
          ) : null}
          <p>
            <Link to={boardPathForKind(summary.kind)}>{t(`feedback.${boardKey}.backToBoard`)}</Link>
          </p>
        </article>
      </>
    );
  }

  const { post, comments, attachmentUrls, subscribed, userVoted } = data;
  const isArchived = Boolean(data.archived || post.archivedAt);
  const readOnly = isArchived;
  const boardPath = boardPathForKind(post.kind);
  const boardKey = boardKeyForKind(post.kind);
  const canEdit = globalMe?.id && (globalMe.admin || globalMe.id === post.authorId);
  const statusOptions = statusesForKind(post.kind);

  return (
    <>
      <FeedbackPageHelmet title={post.title} />
      <article className="content feedback-panel">
      <p>
        <Link to={boardPath}>{t(`feedback.${boardKey}.backToBoard`)}</Link>
        {" · "}
        <Link to={feedbackHistoryPath(historyTabForKind(post.kind))}>{t("feedback.history.viewHistory")}</Link>
      </p>
      {isArchived ? (
        <div className="feedback-archived-banner" role="status">
          {t("feedback.detail.archivedBanner")}
        </div>
      ) : null}
      {globalMe?.admin && post.retentionHold ? (
        <p className="feedback-muted">{t("feedback.detail.retentionHoldOn")}</p>
      ) : null}
      {post.kind === "wishlist" && !editing && attachmentUrls?.length > 0 ? (
        <div className="feedback-wishlist-cover">
          <a href={attachmentUrls[0].url} target="_blank" rel="noreferrer">
            <img
              src={attachmentUrls[0].url}
              alt=""
              className="feedback-wishlist-cover-image"
            />
          </a>
        </div>
      ) : null}
      <h1 className="title lined">
        <span>
          {post.kind === "wishlist" && post.gameUrl ? (
            <a href={post.gameUrl} target="_blank" rel="noopener noreferrer">{post.title}</a>
          ) : (
            post.title
          )}
        </span>
      </h1>
      {post.kind === "wishlist" ? (
        <WishlistCategoryCallout
          category={post.wishlistCategory}
          note={post.wishlistCategoryNote}
        />
      ) : null}
      <div className="feedback-actions">
        <FeedbackStatusBadge
          status={post.status}
          effort={post.effort}
          priority={post.priority}
          wishlistCategory={post.wishlistCategory}
        />
        {(post.kind === "bug" || post.kind === "feature") ? (
          <FeedbackReviewersBadge reviewers={post.reviewers} />
        ) : null}
        <span className="feedback-muted">
          {post.authorName}
          {" · "}
          {t("feedback.meta.posted")} <FeedbackTimestamp date={post.createdAt} />
          {post.updatedAt > post.createdAt + 60_000 ? (
            <>
              {" · "}
              {t("feedback.meta.updated")} <FeedbackTimestamp date={post.updatedAt} />
            </>
          ) : null}
          {" · "}
          {t("feedback.meta.votes", { count: post.effectiveVotes })}
        </span>
        {loggedIn && !readOnly && (
          <>
            <button type="button" className="button apButtonNeutral is-small" onClick={handleVote}>
              {userVoted ? t("feedback.detail.unvote") : t("feedback.detail.vote")}
            </button>
            <button type="button" className="button apButtonNeutral is-small" onClick={handleSubscribe}>
              {subscribed ? t("feedback.detail.unwatch") : t("feedback.detail.watch")}
            </button>
          </>
        )}
        {canEdit && !editing && !readOnly && (
          <button
            type="button"
            className="button apButtonNeutral is-small"
            onClick={() => {
              setEditAttachmentKeys([]);
              setEditing(true);
            }}
          >
            {t("feedback.detail.edit")}
          </button>
        )}
      </div>
      {editing ? (
        <form className="feedback-edit-form" onSubmit={handleSaveEdit}>
          <div className="field">
            <label className="label" htmlFor="feedback-edit-title">
              {post.kind === "wishlist" ? t("feedback.new.gameTitleLabel") : t("feedback.new.titleLabel")}
            </label>
            <input
              id="feedback-edit-title"
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="feedback-edit-body">
              {post.kind === "wishlist" ? t("feedback.new.notesLabel") : t("feedback.new.bodyLabel")}
            </label>
            {post.kind !== "wishlist" ? (
              <p className="feedback-muted feedback-field-hint">{t("feedback.new.bodyMarkdownHint")}</p>
            ) : null}
            <textarea
              id="feedback-edit-body"
              className="textarea"
              rows={5}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              required={post.kind === "feature"}
            />
          </div>
          {post.kind === "wishlist" ? (
            <div className="field">
              <label className="label">{t("feedback.new.coverImage")}</label>
              <p className="feedback-muted feedback-field-hint">{t("feedback.new.coverImageHint")}</p>
              {attachmentUrls?.[0] && editAttachmentKeys.length === 0 ? (
                <div className="feedback-wishlist-cover-edit-preview">
                  <img
                    src={attachmentUrls[0].url}
                    alt=""
                    className="feedback-wishlist-cover-image"
                  />
                  <p className="feedback-muted">{t("feedback.detail.coverReplaceHint")}</p>
                </div>
              ) : null}
              <ScreenshotUpload
                attachmentKeys={editAttachmentKeys}
                onChange={setEditAttachmentKeys}
                maxFiles={1}
                replaceOnUpload
                addLabel={t("feedback.upload.addCover")}
                pasteLabel={t("feedback.upload.pasteCover")}
                pasteHint={t("feedback.upload.pasteCoverHint")}
                countLabelKey="feedback.upload.coverCount"
              />
            </div>
          ) : null}
          <div className="feedback-comment-actions">
            <button type="submit" className="button apButton" disabled={submitting}>
              {submitting ? t("feedback.detail.savingEdit") : t("feedback.detail.saveEdit")}
            </button>
            <button
              type="button"
              className="button apButtonNeutral"
              onClick={() => {
                setEditAttachmentKeys([]);
                setEditing(false);
              }}
              disabled={submitting}
            >
              {t("feedback.detail.cancelEdit")}
            </button>
          </div>
        </form>
      ) : (
        post.body ? (
          <FeedbackMarkdown convertBggBbcode={post.kind === "wishlist"}>
            {post.body}
          </FeedbackMarkdown>
        ) : null
      )}
      {globalMe?.admin && !readOnly && statusOptions.length > 0 && (
        <div className="field">
          <label className="label" htmlFor="feedback-status">{t("feedback.detail.adminStatus")}</label>
          <select id="feedback-status" className="select" value={post.status} onChange={handleStatusChange}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`feedback.status.${status}`, { defaultValue: status })}
              </option>
            ))}
          </select>
        </div>
      )}
      {globalMe?.admin && !readOnly && (
        <form className="feedback-admin-fields" onSubmit={handleSaveAdminFields}>
          {post.kind === "wishlist" ? (
            <>
              <div className="field">
                <label className="label" htmlFor="feedback-wishlist-category">
                  {t("feedback.detail.adminWishlistCategory")}
                </label>
                <select
                  id="feedback-wishlist-category"
                  className="select"
                  value={adminWishlistCategory}
                  onChange={(e) => setAdminWishlistCategory(e.target.value)}
                >
                  {WISHLIST_ADMIN_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(`feedback.wishlist.category.${category}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="feedback-wishlist-note">
                  {t("feedback.detail.adminWishlistNote")}
                </label>
                <textarea
                  id="feedback-wishlist-note"
                  className="textarea"
                  rows={3}
                  value={adminWishlistNote}
                  onChange={(e) => setAdminWishlistNote(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label className="label" htmlFor="feedback-effort">{t("feedback.detail.adminEffort")}</label>
                <select
                  id="feedback-effort"
                  className="select"
                  value={adminEffort}
                  onChange={(e) => setAdminEffort(e.target.value)}
                >
                  <option value="">{t("feedback.admin.allEfforts")}</option>
                  {EFFORT_LEVELS.map((level) => (
                    <option key={level} value={level}>{t(`feedback.effort.${level}`)}</option>
                  ))}
                </select>
              </div>
              <fieldset className="field feedback-priority-fieldset">
                <legend className="label">{t("feedback.detail.adminPriority")}</legend>
                <div className="feedback-priority-options">
                  <label className="radio">
                    <input
                      type="radio"
                      name="feedback-priority"
                      value=""
                      checked={!adminPriority}
                      onChange={() => setAdminPriority("")}
                    />
                    {t("feedback.admin.noPriority")}
                  </label>
                  {PRIORITY_LEVELS.map((level) => (
                    <label key={level} className="radio">
                      <input
                        type="radio"
                        name="feedback-priority"
                        value={level}
                        checked={adminPriority === level}
                        onChange={() => setAdminPriority(level)}
                      />
                      {t(`feedback.priority.${level}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <label className="label" htmlFor="feedback-admin-tags">{t("feedback.detail.adminTags")}</label>
                <input
                  id="feedback-admin-tags"
                  className="input"
                  value={adminTags}
                  onChange={(e) => setAdminTags(e.target.value)}
                />
              </div>
              {(post.kind === "bug" || post.kind === "feature") ? (
                <div className="field">
                  <label className="label">{t("feedback.detail.adminReviewers")}</label>
                  <FeedbackReviewerPicker
                    users={users}
                    selectedIds={adminReviewerIds}
                    onChange={setAdminReviewerIds}
                    disabled={submitting}
                  />
                </div>
              ) : null}
            </>
          )}
          <button type="submit" className="button apButtonNeutral is-small" disabled={submitting}>
            {submitting ? t("feedback.admin.saving") : t("feedback.detail.saveAdminFields")}
          </button>
          {post.kind === "wishlist" ? (
            <div className="feedback-admin-delete">
              <button
                type="button"
                className="button is-small is-danger is-light"
                onClick={() => {
                  setDeleteReason("");
                  setShowDeleteModal(true);
                }}
                disabled={submitting}
              >
                {t("feedback.detail.deleteWishlist")}
              </button>
            </div>
          ) : null}
        </form>
      )}
      {globalMe?.admin && !readOnly && post.kind === "wishlist" ? (
        <Modal
          show={showDeleteModal}
          title={t("feedback.detail.deleteWishlistTitle")}
          disableBackdropClose={submitting}
          buttons={[
            {
              label: submitting ? t("feedback.detail.deleting") : t("feedback.detail.deleteWishlistConfirm"),
              action: handleDelete,
              disabled: submitting || !deleteReason.trim(),
            },
            {
              label: t("feedback.detail.deleteWishlistCancel"),
              action: () => {
                if (!submitting) {
                  setShowDeleteModal(false);
                }
              },
              disabled: submitting,
            },
          ]}
        >
          <p>{t("feedback.detail.deleteWishlistIntro")}</p>
          <div className="field">
            <label className="label" htmlFor="feedback-delete-reason">
              {t("feedback.detail.deleteWishlistReason")}
            </label>
            <textarea
              id="feedback-delete-reason"
              className="textarea"
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              required
              maxLength={2000}
              disabled={submitting}
            />
          </div>
          {error ? <p className="has-text-danger">{error}</p> : null}
        </Modal>
      ) : null}
      {attachmentUrls?.length > 0 && post.kind !== "wishlist" && (
        <div className="feedback-screenshot-grid">
          {attachmentUrls.map(({ key, url }) => (
            <a key={key} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" className="feedback-screenshot-thumb" />
            </a>
          ))}
        </div>
      )}
      <h2 className="subtitle">{t("feedback.detail.comments")}</h2>
      {comments.length === 0 ? (
        <p className="feedback-muted">{t("feedback.detail.noComments")}</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.commentId}
            className={`feedback-comment${comment.isStaff ? " feedback-comment-staff" : ""}`}
          >
            <div className="feedback-muted">
              {comment.authorName}
              {comment.isStaff ? ` · ${t("feedback.detail.staff")}` : ""}
              {" · "}
              <FeedbackTimestamp date={comment.createdAt} />
            </div>
            <FeedbackMarkdown>{comment.body}</FeedbackMarkdown>
          </div>
        ))
      )}
      {globalMe?.admin && (
        <div className="feedback-retention-actions">
          <button
            type="button"
            className="button apButtonNeutral is-small"
            disabled={submitting}
            onClick={() => handleRetentionHold(!post.retentionHold)}
          >
            {post.retentionHold
              ? t("feedback.detail.releaseRetention")
              : t("feedback.detail.holdRetention")}
          </button>
          {!post.retentionHold ? (
            <span className="feedback-muted">{t("feedback.detail.retentionHoldOff")}</span>
          ) : null}
        </div>
      )}
      {!loggedIn && !readOnly ? (
        <FeedbackSignInRequired messageKey="feedback.auth.signInToInteract" />
      ) : null}
      {loggedIn && !readOnly && (
        <form onSubmit={handleComment}>
          <div className="field">
            <label className="label" htmlFor="feedback-comment">{t("feedback.detail.addComment")}</label>
            <textarea
              id="feedback-comment"
              className="textarea"
              rows={3}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              required
              maxLength={2000}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifyMe}
              onChange={(e) => setNotifyMe(e.target.checked)}
            />
            {t("feedback.detail.notifyMe")}
          </label>
          <div className="feedback-comment-actions">
            {error && <p className="has-text-danger">{error}</p>}
            <button type="submit" className="button apButton" disabled={submitting}>
              {submitting ? t("feedback.detail.posting") : t("feedback.detail.postComment")}
            </button>
          </div>
        </form>
      )}
    </article>
    </>
  );
}

export default FeedbackDetail;
