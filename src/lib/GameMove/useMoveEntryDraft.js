import { useCallback, useEffect, useRef, useState } from "react";
import {
  readMoveEntryTextareaMode,
  writeMoveEntryTextareaMode,
} from "./moveEntryTextareaPreference.js";

/**
 * Session-level move box draft + textarea mode (localStorage).
 */
export function useMoveEntryDraft(move) {
  const moveDraftRef = useRef(move?.move ?? "");
  const [moveDraft, setMoveDraftState] = useState(move?.move ?? "");
  const [textareaMode, setTextareaModeState] = useState(() =>
    readMoveEntryTextareaMode()
  );

  const setMoveDraft = useCallback((value) => {
    const v = value ?? "";
    moveDraftRef.current = v;
    setMoveDraftState(v);
  }, []);

  useEffect(() => {
    const m = move?.move ?? "";
    moveDraftRef.current = m;
    setMoveDraftState(m);
  }, [move?.move]);

  const committedMove = move?.move ?? "";
  const hasUnappliedDraft =
    textareaMode && moveDraft !== committedMove;

  const setTextareaMode = useCallback(
    (enabled, { confirmDiscard } = {}) => {
      if (!enabled && textareaMode && hasUnappliedDraft) {
        if (confirmDiscard && !confirmDiscard()) {
          return false;
        }
      }
      writeMoveEntryTextareaMode(enabled);
      setTextareaModeState(enabled);
      return true;
    },
    [hasUnappliedDraft, textareaMode]
  );

  return {
    moveDraftRef,
    moveDraft,
    setMoveDraft,
    textareaMode,
    setTextareaMode,
    hasUnappliedDraft,
    committedMove,
  };
}
