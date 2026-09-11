import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ScreenshotUpload from "./ScreenshotUpload";
import { createFeedback } from "../../lib/feedback/feedbackApi";
import { captureBugContext } from "../../lib/feedback/feedbackContext";
import { boardKeyForKind, boardPathForKind, feedbackDetailPath } from "../../lib/feedback/feedbackConstants";
import FeedbackPageHelmet from "./FeedbackPageHelmet";
import "./feedback.css";

function resolveKind(kindParam) {
  if (kindParam === "feature") {
    return "feature";
  }
  if (kindParam === "wishlist") {
    return "wishlist";
  }
  return "bug";
}

function FeedbackNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kind = resolveKind(searchParams.get("kind"));
  const boardKey = boardKeyForKind(kind);
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [body, setBody] = useState("");
  const [gameUrl, setGameUrl] = useState(searchParams.get("gameUrl") ?? "");
  const [attachmentKeys, setAttachmentKeys] = useState([]);
  const [confirmNoScreenshot, setConfirmNoScreenshot] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateId, setDuplicateId] = useState("");

  const context = useMemo(
    () => (kind === "bug" ? captureBugContext(searchParams) : undefined),
    [kind, searchParams],
  );

  const missingScreenshot = kind === "bug" && attachmentKeys.length < 1;

  function handleAttachmentChange(keys) {
    setAttachmentKeys(keys);
    if (keys.length > 0) {
      setConfirmNoScreenshot(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setDuplicateId("");
    if (missingScreenshot && !confirmNoScreenshot) {
      setConfirmNoScreenshot(true);
      return;
    }
    setSubmitting(true);
    const result = await createFeedback({
      kind,
      title: title.trim(),
      body: body.trim() || undefined,
      gameUrl: kind === "wishlist" ? gameUrl.trim() : undefined,
      attachmentKeys: kind !== "wishlist" && attachmentKeys.length > 0 ? attachmentKeys : undefined,
      context: kind === "bug" ? context : undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      if (result.code === "duplicate" && result.existingId) {
        setDuplicateId(result.existingId);
      }
      return;
    }
    navigate(feedbackDetailPath(result.data.id));
  }

  const submitLabel = submitting
    ? t("feedback.new.submitting")
    : missingScreenshot && confirmNoScreenshot
      ? t("feedback.new.submitWithoutScreenshot")
      : kind === "feature"
        ? t("feedback.new.submitFeature")
        : kind === "wishlist"
          ? t("feedback.new.submitWishlist")
          : t("feedback.new.submit");

  const pageTitle = kind === "feature"
    ? t("feedback.new.titleFeature")
    : kind === "wishlist"
      ? t("feedback.new.titleWishlist")
      : t("feedback.new.title");

  return (
    <>
      <FeedbackPageHelmet title={pageTitle} />
      <article className="content feedback-panel">
      <h1 className="title lined">
        <span>{pageTitle}</span>
      </h1>
      <p>
        <Link to={boardPathForKind(kind)}>{t(`feedback.${boardKey}.backToBoard`)}</Link>
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="feedback-title">
            {kind === "wishlist" ? t("feedback.new.gameTitleLabel") : t("feedback.new.titleLabel")}
          </label>
          <input
            id="feedback-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        {kind === "wishlist" ? (
          <div className="field">
            <label className="label" htmlFor="feedback-game-url">{t("feedback.new.gameUrlLabel")}</label>
            <input
              id="feedback-game-url"
              className="input"
              type="url"
              value={gameUrl}
              onChange={(e) => setGameUrl(e.target.value)}
              required
              placeholder="https://"
            />
          </div>
        ) : null}
        <div className="field">
          <label className="label" htmlFor="feedback-body">
            {kind === "wishlist" ? t("feedback.new.notesLabel") : t("feedback.new.bodyLabel")}
          </label>
          <p className="feedback-muted feedback-field-hint">{t("feedback.new.bodyMarkdownHint")}</p>
          <textarea
            id="feedback-body"
            className="textarea"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required={kind === "feature"}
          />
        </div>
        {kind !== "wishlist" ? (
          <div className="field">
            <label className="label">
              {kind === "feature" ? t("feedback.new.attachments") : t("feedback.new.screenshots")}
            </label>
            <ScreenshotUpload
              attachmentKeys={attachmentKeys}
              onChange={handleAttachmentChange}
            />
          </div>
        ) : null}
        {kind === "bug" && (
          <div className="field">
            <button
              type="button"
              className="button apButtonNeutral is-small"
              onClick={() => setShowTech((v) => !v)}
            >
              {t("feedback.new.techDetails")}
            </button>
            {showTech && (
              <pre className="feedback-tech-preview">
                {JSON.stringify(context, null, 2)}
              </pre>
            )}
          </div>
        )}
        {error && <p className="has-text-danger">{error}</p>}
        {duplicateId ? (
          <p>
            <Link to={feedbackDetailPath(duplicateId)}>{t("feedback.wishlist.viewExisting")}</Link>
          </p>
        ) : null}
        <button type="submit" className="button apButton" disabled={submitting}>
          {submitLabel}
        </button>
        {missingScreenshot && confirmNoScreenshot && (
          <p className="has-text-danger feedback-screenshot-nudge">
            {t("feedback.new.screenshotEncouraged")}
          </p>
        )}
      </form>
    </article>
    </>
  );
}

export default FeedbackNew;
