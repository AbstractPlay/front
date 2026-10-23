import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";

export const MOVE_ENTRY_DEBOUNCE_MS = 500;

/**
 * Local move-box text with debounced commit to session validation (handleMove).
 */
export function useDebouncedMoveInput({ move, onCommit }) {
  const [inputValue, setInputValue] = useState(move?.move ?? "");

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
    setInputValue(move?.move ?? "");
  }, [move?.move]);

  const handleMoveInputChange = (value) => {
    setInputValue(value);
    debouncedCommit(value);
  };

  const handleClear = () => {
    debouncedCommit.cancel();
    setInputValue("");
    onCommit("");
  };

  const cancelPending = () => {
    debouncedCommit.cancel();
  };

  return {
    inputValue,
    handleMoveInputChange,
    handleClear,
    cancelPending,
  };
}
