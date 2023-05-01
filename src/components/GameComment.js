import React, { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";

function GameComment(props) {
  const [comment, commentSetter] = useState("");
  const [toolong, toolongSetter] = useState(false);
  const { t } = useTranslation();

  const handleChange = (comment) => {
    toolongSetter(comment.length > 4000);
    commentSetter(comment);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(comment.substring(0, 4000));
    commentSetter("");
  };

  return (
    <Fragment>
      {toolong || props.tooMuch ? (
        <p className="is-danger">{t("CommentTooLong")}</p>
      ) : (
        <Fragment>
          <div className="field">
            <label className="label" htmlFor="enterAComment">
              {t("Comment")}
            </label>
            <div className="control">
              <textarea
                id="enterAComment"
                name="enterAComment"
                className="textarea"
                value={comment}
                placeholder={t("Comment")}
                onChange={(e) => handleChange(e.target.value)}
                rows="3"
              ></textarea>
            </div>
          </div>
          <div className="field">
            <div className="control">
              <button className="button is-small" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
}

export default GameComment;
