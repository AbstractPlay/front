import { useMemo } from "react";
import { buildMoveTreeMobileStepperProps } from "../../lib/GameMove/buildMoveTreeMobileStepperProps";
import MoveTreeMobileStepper from "./MoveTreeMobileStepper";

/**
 * Mobile prev/next bar for the whole game page (not only when the move list is open).
 */
function MoveTreeMobileChrome({ session }) {
  const {
    t,
    focus,
    game,
    error,
    isGameLoading,
    handleGameMoveClick,
    explorationRef,
    explorationVersion,
  } = session;

  const stepperProps = useMemo(() => {
    void explorationVersion;
    if (isGameLoading || error || !focus || !game) {
      return null;
    }
    const exploration = explorationRef.current?.nodes;
    if (!exploration) {
      return null;
    }
    return buildMoveTreeMobileStepperProps({
      focus,
      exploration,
      game,
      handleGameMoveClick,
    });
  }, [
    isGameLoading,
    error,
    focus,
    game,
    explorationVersion,
    handleGameMoveClick,
    explorationRef,
  ]);

  if (!stepperProps) {
    return null;
  }

  return <MoveTreeMobileStepper t={t} {...stepperProps} />;
}

export default MoveTreeMobileChrome;
