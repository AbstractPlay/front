import { useGameMoveSession } from "./GameMove/useGameMoveSession";
import GameMoveClassicLayout from "./GameMove/GameMoveClassicLayout";

function GameMove(props) {
  const session = useGameMoveSession(props);
  return <GameMoveClassicLayout session={session} />;
}

export default GameMove;
