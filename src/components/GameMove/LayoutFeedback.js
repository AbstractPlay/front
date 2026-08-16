import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  gameMovePath,
  layoutLabelKey,
} from "../../lib/GameMove/layoutPreference";
import { LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH } from "../../lib/GameMove/layoutFeedbackConstants";
import { logLayoutFeedbackEvent } from "../../lib/GameMove/layoutFeedback";
import LayoutSwitcher from "./LayoutSwitcher";

const MOBILE_FEEDBACK_MAX_WIDTH = 768;
const COMMENT_COUNTER_THRESHOLD = 400;

function useMobileFeedbackCollapsed() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > MOBILE_FEEDBACK_MAX_WIDTH;
  });

  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width: ${MOBILE_FEEDBACK_MAX_WIDTH}px)`
    );
    const onChange = (event) => {
      if (!event.matches) {
        setExpanded(true);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return [expanded, setExpanded];
}

function LayoutFeedback({ layoutId }) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();
  const [rated, setRated] = useState(null);
  const [comment, setComment] = useState("");
  const [notePosted, setNotePosted] = useState(false);
  const [expanded, setExpanded] = useMobileFeedbackCollapsed();
  const sessionStartRef = useRef(Date.now());
  const notePostedTimeoutRef = useRef(null);

  useEffect(() => {
    logLayoutFeedbackEvent({
      type: "session_start",
      layoutId,
      gameId: gameID,
    });
  }, [layoutId, gameID]);

  useEffect(() => {
    return () => {
      if (notePostedTimeoutRef.current !== null) {
        clearTimeout(notePostedTimeoutRef.current);
      }
    };
  }, []);

  const classicHref = gameMovePath(metaGame, cbits, gameID, { beta: false });
  const layoutName = t(layoutLabelKey(layoutId));
  const layoutTitle = `${t("gameMove.layout.switchLayout")}: ${layoutName}`;
  const trimmedComment = comment.trim();
  const canPostNote =
    trimmedComment.length > 0 &&
    trimmedComment.length <= LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH;
  const showCommentCounter = comment.length > COMMENT_COUNTER_THRESHOLD;

  const handleRating = (rating) => {
    if (rated) return;
    setRated(rating);
    logLayoutFeedbackEvent({
      type: "feedback",
      layoutId,
      gameId: gameID,
      rating,
      durationMs: Date.now() - sessionStartRef.current,
    });
  };

  const handlePostNote = () => {
    if (!canPostNote) return;

    logLayoutFeedbackEvent({
      type: "feedback_note",
      layoutId,
      gameId: gameID,
      comment: trimmedComment,
      durationMs: Date.now() - sessionStartRef.current,
    });
    setComment("");
    setNotePosted(true);
    if (notePostedTimeoutRef.current !== null) {
      clearTimeout(notePostedTimeoutRef.current);
    }
    notePostedTimeoutRef.current = setTimeout(() => {
      setNotePosted(false);
      notePostedTimeoutRef.current = null;
    }, 3000);
  };

  const handleBackToClassic = () => {
    logLayoutFeedbackEvent({
      type: "switch_to_classic",
      layoutId,
      gameId: gameID,
      durationMs: Date.now() - sessionStartRef.current,
    });
  };

  return (
    <aside
      className={`game-move-layout-feedback${
        expanded ? " is-expanded" : " is-collapsed"
      }`}
      aria-label={t("gameMove.layout.feedbackAria")}
    >
      <div className="game-move-layout-feedback__panel">
        <p className="game-move-layout-feedback__title">{layoutTitle}</p>
        <button
          type="button"
          className="game-move-layout-feedback__toggle"
          aria-expanded={expanded}
          aria-controls="game-move-layout-feedback-body"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="game-move-layout-feedback__toggle-label">
            {layoutTitle}
          </span>
          <span className="icon game-move-layout-feedback__toggle-icon" aria-hidden="true">
            <i className={`fa fa-chevron-${expanded ? "down" : "up"}`} />
          </span>
          <span className="game-move-layout-feedback__toggle-hint">
            {expanded
              ? t("gameMove.layout.feedbackCollapse")
              : t("gameMove.layout.feedbackExpand")}
          </span>
        </button>
        <div
          id="game-move-layout-feedback-body"
          className="game-move-layout-feedback__body"
        >
          <LayoutSwitcher layoutId={layoutId} />
          {rated ? (
            <p className="game-move-layout-feedback__thanks">
              {t("gameMove.layout.feedbackThanks")}
            </p>
          ) : (
            <div className="game-move-layout-feedback__rating">
              <span className="game-move-layout-feedback__prompt">
                {t("gameMove.layout.feedbackPrompt")}
              </span>
              <button
                type="button"
                className="button is-small apButtonNeutral"
                aria-label={t("gameMove.layout.feedbackUp")}
                onClick={() => handleRating("up")}
              >
                <span className="icon" aria-hidden="true">
                  <i className="fa fa-thumbs-up" />
                </span>
              </button>
              <button
                type="button"
                className="button is-small apButtonNeutral"
                aria-label={t("gameMove.layout.feedbackDown")}
                onClick={() => handleRating("down")}
              >
                <span className="icon" aria-hidden="true">
                  <i className="fa fa-thumbs-down" />
                </span>
              </button>
            </div>
          )}
          <label className="game-move-layout-feedback__comment">
            <span className="game-move-layout-feedback__comment-label">
              {t("gameMove.layout.feedbackCommentLabel")}
            </span>
            <div className="game-move-layout-feedback__comment-row">
              <input
                type="text"
                className="input is-small game-move-layout-feedback__comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("gameMove.layout.feedbackCommentPlaceholder")}
                maxLength={LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH}
              />
              <button
                type="button"
                className="button is-small apButton"
                disabled={!canPostNote}
                onClick={handlePostNote}
              >
                {t("gameMove.layout.feedbackPost")}
              </button>
            </div>
            {showCommentCounter ? (
              <span className="game-move-layout-feedback__comment-counter">
                {comment.length}/{LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH}
              </span>
            ) : null}
            {notePosted ? (
              <p className="game-move-layout-feedback__note-posted" role="status">
                {t("gameMove.layout.feedbackNotePosted")}
              </p>
            ) : null}
          </label>
          <Link
            className="button is-small apButtonNeutral"
            to={classicHref}
            onClick={handleBackToClassic}
          >
            {t("gameMove.layout.backToClassic")}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default LayoutFeedback;
