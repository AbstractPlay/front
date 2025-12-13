import { useParams, useLocation } from "react-router-dom";
import GameMove from "./GameMove";

// A wrapper that is used to remount GameMove in case metaGame or gameID changes (e.g. when we navigate to GameMove when user clicks on "Next Game")
function GameMoveWrapper() {
  const params = useParams();
  const location = useLocation();
  // Pass the location as a prop so GameMove can access the state
  return (
    <GameMove
      key={`${params.metaGame}-${params.gameID}`}
      routerState={location.state}
    />
  );
}

export default GameMoveWrapper;
