import React from "react";
import { useMoveEntryInput } from "../../lib/GameMove/useMoveEntryInput";

/**
 * Shared move entry control (single-line debounced or textarea + Commit).
 */
export default function MoveEntryField({
  move,
  moveDraft,
  onDraftChange,
  onCommit,
  textareaMode,
  onTextareaModeChange,
  moveState,
  inputId = "enterAMove",
  inputSize = "is-small",
  wrapperClassName = "control input-icon",
  showClear = true,
  t,
}) {
  const committedMove = move?.move ?? "";
  const {
    handleMoveInputChange,
    handleClear,
    commitDraft,
    handleKeyDown,
    hasUnappliedDraft,
  } = useMoveEntryInput({
    moveDraft,
    committedMove,
    onDraftChange,
    onCommit,
    textareaMode,
  });

  const inputClass = `input ${inputSize} ${moveState}${
    hasUnappliedDraft ? " game-move-entry-field--unapplied" : ""
  }`;

  return (
    <div className="game-move-entry-field">
      <div className="game-move-entry-field__mode">
        <button
          type="button"
          className="game-move-entry-field__mode-btn tooltipped"
          aria-pressed={textareaMode}
          aria-label={t("gameMove.moveEntry.textareaMode")}
          onClick={() => onTextareaModeChange(!textareaMode)}
        >
          <i
            className={`fa ${textareaMode ? "fa-align-left" : "fa-list"}`}
            aria-hidden="true"
          />
          <span className="tooltiptext">
            {t("gameMove.moveEntry.textareaModeTooltip")}
          </span>
        </button>
      </div>
      {hasUnappliedDraft ? (
        <p className="help is-warning game-move-entry-field__unapplied-hint">
          {t("gameMove.moveEntry.unappliedEdits")}
        </p>
      ) : null}
      <div className={wrapperClassName}>
        {textareaMode ? (
          <textarea
            className={`${inputClass} game-move-entry-field__textarea`}
            name="move"
            id={inputId}
            value={moveDraft}
            onChange={(e) => handleMoveInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("EnterMove")}
            aria-label={t("EnterMove")}
            rows={4}
          />
        ) : (
          <input
            className={inputClass}
            name="move"
            id={inputId}
            type="text"
            value={moveDraft}
            onChange={(e) => handleMoveInputChange(e.target.value)}
            placeholder={t("EnterMove")}
            aria-label={t("EnterMove")}
          />
        )}
        {showClear && moveDraft.length > 0 ? (
          <button
            type="button"
            className="game-move-entry-field__clear tooltipped"
            onClick={handleClear}
            aria-label={t("ClearMove")}
          >
            <i className="fa fa-trash resetIcon" aria-hidden="true" />
            <span className="tooltiptext">{t("ClearMove")}</span>
          </button>
        ) : null}
      </div>
      {textareaMode && hasUnappliedDraft ? (
        <div className="game-move-entry-field__commit">
          <button
            type="button"
            className={`button ${inputSize === "is-small" ? "is-small " : ""}apButton`}
            onClick={commitDraft}
          >
            {t("gameMove.moveEntry.commitDraft")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
