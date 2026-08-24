import { useEffect, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useStore } from "../stores";
import { useAuthSession } from "../hooks/useAuthSession";
import GameMoveBetaShell from "./GameMoveBetaShell";
import Spinner from "./Spinner";
import { gameMovePath } from "../lib/GameMove/layoutPreference";

/**
 * Beta play page is logged-in only. On refresh/HMR, globalMe starts null until
 * profile bootstrap finishes — wait for Cognito before redirecting to classic.
 */
function GameMoveBetaWrapper() {
  const params = useParams();
  const location = useLocation();
  const globalMe = useStore((state) => state.globalMe);
  const { status } = useAuthSession();
  const [sessionState, setSessionState] = useState("checking");

  useEffect(() => {
    if (status === "unknown" || status === "loading") {
      setSessionState("checking");
      return;
    }
    setSessionState(status === "ready" ? "authed" : "anonymous");
  }, [status]);

  const classicPath = gameMovePath(
    params.metaGame,
    params.cbits,
    params.gameID,
    { beta: false }
  );

  if (sessionState === "checking") {
    return <Spinner />;
  }

  if (sessionState === "anonymous") {
    return <Navigate to={classicPath} replace state={{ from: location }} />;
  }

  if (globalMe === null) {
    return <Spinner />;
  }

  return (
    <GameMoveBetaShell
      metaGame={params.metaGame}
      cbits={params.cbits}
      gameID={params.gameID}
    />
  );
}

export default GameMoveBetaWrapper;
