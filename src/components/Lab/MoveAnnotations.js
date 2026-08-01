import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { debounce } from "lodash";
import { VALID_NAGS } from "./GameTree";
import { saveLabExploration } from "../../lib/Lab/exploration";

function MoveAnnotations({ focusNode, onChange }) {
  const { t } = useTranslation();
  const [nag, nagSetter] = useState("");
  const [textComment, textCommentSetter] = useState("");
  const [tab, tabSetter] = useState("edit");

  const debouncedSave = useMemo(
    () => debounce(() => saveLabExploration(), 300),
    []
  );

  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  useEffect(() => {
    nagSetter(focusNode?.nag ?? "");
    textCommentSetter(focusNode?.textComment ?? "");
    tabSetter("edit");
  }, [focusNode]);

  if (!focusNode?.move) {
    return null;
  }

  const applyToNode = (nextNag, nextComment) => {
    focusNode.SetNag(nextNag || undefined);
    focusNode.SetTextComment(nextComment);
    onChange();
    debouncedSave();
  };

  const handleNagClick = (value) => {
    const next = nag === value ? "" : value;
    nagSetter(next);
    debouncedSave.cancel();
    applyToNode(next, textComment);
    saveLabExploration();
  };

  const handleCommentChange = (value) => {
    textCommentSetter(value);
    focusNode.SetTextComment(value);
    onChange();
    debouncedSave();
  };

  return (
    <div className="moveAnnotations">
      <h2 className="subtitle lined">
        <span>{t("lab.annotations.title")}</span>
      </h2>
      <div className="field">
        <label className="label is-small">
          {t("lab.annotations.moveQuality")}
        </label>
        <div className="buttons are-small">
          {VALID_NAGS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              className={`button apButtonNeutral${
                nag === symbol ? " is-selected" : ""
              }`}
              onClick={() => handleNagClick(symbol)}
            >
              {symbol}
            </button>
          ))}
          {nag ? (
            <button
              type="button"
              className="button is-small"
              onClick={() => handleNagClick(nag)}
            >
              {t("lab.annotations.clear")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="field">
        <label className="label is-small" htmlFor="playgroundMoveComment">
          {t("lab.annotations.commentMarkdown")}
        </label>
        <div className="tabs is-small">
          <ul>
            <li className={tab === "edit" ? "is-active" : ""}>
              <a
                href="#comment-edit"
                onClick={(e) => {
                  e.preventDefault();
                  tabSetter("edit");
                }}
              >
                {t("Edit")}
              </a>
            </li>
            <li className={tab === "preview" ? "is-active" : ""}>
              <a
                href="#comment-preview"
                onClick={(e) => {
                  e.preventDefault();
                  tabSetter("preview");
                }}
              >
                {t("Preview")}
              </a>
            </li>
          </ul>
        </div>
        {tab === "edit" ? (
          <div className="control">
            <textarea
              id="playgroundMoveComment"
              className="textarea is-small"
              rows={4}
              value={textComment}
              placeholder={t("lab.annotations.commentPlaceholder")}
              onChange={(e) => handleCommentChange(e.target.value)}
            />
          </div>
        ) : (
          <div className="content moveAnnotationPreview">
            {textComment.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {textComment}
              </ReactMarkdown>
            ) : (
              <p className="help">{t("lab.annotations.nothingToPreview")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoveAnnotations;
