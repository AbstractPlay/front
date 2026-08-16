import { useParams, useLocation } from "react-router-dom";
import GameMove from "./GameMove";
import LayoutExperimentBanner from "./GameMove/LayoutExperimentBanner";
import { useGameMoveLayout } from "../hooks/useGameMoveLayout";
import { MOVE_CLASSIC_BASE } from "../lib/GameMove/layoutPreference";

function GameMoveWrapper() {
  const params = useParams();
  const location = useLocation();
  const { moveBasePath, showExperimentBanner, dismissBanner } =
    useGameMoveLayout();

  return (
    <>
      {showExperimentBanner ? (
        <LayoutExperimentBanner onDismiss={dismissBanner} />
      ) : null}
      <GameMove
        key={`${params.metaGame}-${params.gameID}`}
        routerState={location.state}
        moveBasePath={moveBasePath ?? MOVE_CLASSIC_BASE}
        showExperimentBanner={false}
      />
    </>
  );
}

export default GameMoveWrapper;
