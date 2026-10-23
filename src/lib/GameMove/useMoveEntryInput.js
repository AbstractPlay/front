import { useCallback, useEffect, useMemo } from "react";
import { debounce } from "lodash";
import { MOVE_ENTRY_DEBOUNCE_MS } from "./useDebouncedMoveInput.js";

/**
 * Move box typing: debounced commit in single-line mode; draft-only in textarea mode.
 */
export function useMoveEntryInput({
  moveDraft,
  committedMove = "",
  onDraftChange,
  onCommit,
  textareaMode,
}) {
  const debouncedCommit = useMemo(
    () => debounce((value) => onCommit(value), MOVE_ENTRY_DEBOUNCE_MS),
    [onCommit]
  );

  useEffect(() => {
    return () => {
      debouncedCommit.cancel();
    };
  }, [debouncedCommit]);

  useEffect(() => {
    if (textareaMode) {
      debouncedCommit.cancel();
    }
  }, [debouncedCommit, textareaMode]);

  const handleMoveInputChange = useCallback(
    (value) => {
      onDraftChange(value);
      if (!textareaMode) {
        debouncedCommit(value);
      }
    },
    [debouncedCommit, onDraftChange, textareaMode]
  );

  const handleClear = useCallback(() => {
    debouncedCommit.cancel();
    onDraftChange("");
    onCommit("");
  }, [debouncedCommit, onCommit, onDraftChange]);

  const cancelPending = useCallback(() => {
    debouncedCommit.cancel();
  }, [debouncedCommit]);

  const commitDraft = useCallback(() => {
    debouncedCommit.cancel();
    onCommit(moveDraft ?? "");
  }, [debouncedCommit, moveDraft, onCommit]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!textareaMode) {
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if ((moveDraft ?? "") !== (committedMove ?? "")) {
          commitDraft();
        }
      }
    },
    [commitDraft, committedMove, moveDraft, textareaMode]
  );

  const hasUnappliedDraft =
    textareaMode && (moveDraft ?? "") !== (committedMove ?? "");

  return {
    handleMoveInputChange,
    handleClear,
    cancelPending,
    commitDraft,
    handleKeyDown,
    hasUnappliedDraft,
  };
}
