import React, { useState, useEffect, Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";

/** Match `.game-comment-short__input { max-height: 8rem }` in index.css */
const COMMENT_TEXTAREA_MIN_HEIGHT_PX = 30;
const COMMENT_TEXTAREA_MAX_HEIGHT_PX = 128;

/** In-progress composer text when chat UI unmounts (e.g. drawer tab switch). */
const chatDraftByGameId = new Map();

function draftKey(gameid) {
  return gameid != null && gameid !== "" ? String(gameid) : "__anonymous__";
}

export function clearGameChatDraft(gameId) {
  if (gameId != null && gameId !== "") {
    chatDraftByGameId.delete(String(gameId));
  }
}

function scrollParentsOf(el) {
  const saved = [];
  let node = el?.parentElement;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") {
      saved.push({ node, scrollTop: node.scrollTop });
    }
    node = node.parentElement;
  }
  return saved;
}

function GameCommentShort(props) {
  const gameKey = draftKey(props.gameid);
  const [comment, commentSetter] = useState(
    () => chatDraftByGameId.get(gameKey) ?? ""
  );
  const [toolong, toolongSetter] = useState(false);
  const { t } = useTranslation();
  const textareaRef = useRef();

  useEffect(() => {
    if (props.comment !== undefined && props.comment !== "") {
      commentSetter(props.comment);
      chatDraftByGameId.set(gameKey, props.comment);
    }
  }, [props.comment, gameKey]);

  useEffect(() => {
    commentSetter(chatDraftByGameId.get(gameKey) ?? "");
  }, [gameKey]);

  const handleChange = (next) => {
    toolongSetter(next.length > 4000);
    commentSetter(next);
    chatDraftByGameId.set(gameKey, next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(comment.substring(0, 4000));
    chatDraftByGameId.delete(gameKey);
    commentSetter("");
  };

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (el === undefined || el === null) {
      return;
    }
    const scrollSnapshot = scrollParentsOf(el);
    const windowScrollY = window.scrollY;

    // Reset height - important to shrink on delete
    el.style.height = "inherit";
    const nextHeight = Math.min(
      Math.max(el.scrollHeight, COMMENT_TEXTAREA_MIN_HEIGHT_PX),
      COMMENT_TEXTAREA_MAX_HEIGHT_PX
    );
    el.style.height = `${nextHeight}px`;

    for (const { node, scrollTop } of scrollSnapshot) {
      node.scrollTop = scrollTop;
    }
    window.scrollTo(0, windowScrollY);
  }, [comment]);

  return (
    <Fragment>
      {toolong || props.tooMuch ? (
        <p className="is-danger">{t("CommentTooLong")}</p>
      ) : (
        <Fragment>
          <div className="field is-grouped">
            <div className="control">
              <textarea
                type="textarea"
                ref={textareaRef}
                rows={1}
                id="enterAComment"
                name="enterAComment"
                className="input is-small game-comment-short__input"
                value={comment}
                placeholder={t("Comment")}
                onChange={(e) => handleChange(e.target.value)}
              ></textarea>
            </div>
            <div className="control">
              <button
                className="button is-small apButtonNeutral"
                onClick={handleSubmit}
              >
                {t("Comment")}
              </button>
            </div>
          </div>
          {!props.commentingCompletedGame ? null : (
            <div>
              <p className="help">
                This comment will be tied to the selected move and be publicly
                visible.
              </p>
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
}

export default GameCommentShort;
