import React, { useState, useEffect, Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";

function GameCommentShort(props) {
  const [comment, commentSetter] = useState("");
  const [toolong, toolongSetter] = useState(false);
  const { t } = useTranslation();
  const textareaRef = useRef();

  useEffect(() => {
    commentSetter(props.comment);
  }, [props.comment]);

  const handleChange = (comment) => {
    toolongSetter(comment.length > 4000);
    commentSetter(comment);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(comment.substring(0, 4000));
    commentSetter("");
  };

  React.useLayoutEffect(() => {
    if (textareaRef.current !== undefined && textareaRef.current !== null) {
      // Reset height - important to shrink on delete
      textareaRef.current.style.height = "inherit";
      // Set height
      textareaRef.current.style.height = `${Math.max(
        textareaRef.current.scrollHeight,
        30
      )}px`;
    }
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
                className="input is-small"
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
        </Fragment>
      )}
    </Fragment>
  );
}

export default GameCommentShort;
