import { useCallback, useEffect, useRef } from "react";
import { handleMoveTreeKeyDown } from "../../lib/GameMove/moveTreeKeyboard";

/**
 * Window-level move-tree keyboard navigation (arrows, hjkl, Home/End).
 * Lives on the session so shortcuts work when the move list panel is hidden.
 */
export function useGameMoveKeyboardNav({
  focus,
  gameRef,
  explorationRef,
  handleGameMoveClickRef,
}) {
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const handleGameMoveClickLatestRef = useRef(handleGameMoveClickRef.current);
  handleGameMoveClickLatestRef.current = handleGameMoveClickRef.current;

  const onKeyDown = useCallback(
    (event) => {
      const exploration = explorationRef.current?.nodes ?? null;
      const game = gameRef.current;
      const handleGameMoveClick = handleGameMoveClickLatestRef.current;
      if (!handleGameMoveClick) {
        return;
      }
      handleMoveTreeKeyDown(event, {
        focus: focusRef.current,
        exploration,
        game,
        handleGameMoveClick,
      });
    },
    [explorationRef, gameRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}
