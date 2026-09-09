import { useParams, useLocation, Navigate } from "react-router-dom";
import GameMoveShell from "./GameMoveShell";

function GameMoveLegacyRedirect() {
  const { metaGame, cbits, gameID } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={`/move/${metaGame}/${cbits}/${gameID}${location.search}`}
      replace
      state={location.state}
    />
  );
}

function GameMoveWrapper() {
  const params = useParams();

  return (
    <GameMoveShell key={`${params.metaGame}-${params.gameID}`} />
  );
}

export { GameMoveLegacyRedirect };
export default GameMoveWrapper;
