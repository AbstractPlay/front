import { useParams } from "react-router-dom";
import GameMove from "./GameMove";

// A wrapper that is used to remount GameMove in case metaGame or gameID changes (e.g. when we navigate to GameMove when user clicks on "Next Game")
function GameMoveWrapper() {
  const params = useParams();
  return <GameMove key={`${params.metaGame}-${params.gameID}`} />;
}

export default GameMoveWrapper;
