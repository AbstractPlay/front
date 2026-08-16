import { useEffect, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import { useStore } from "../stores";
import GameMoveBetaShell from "./GameMoveBetaShell";
import Spinner from "./Spinner";
import { gameMovePath } from "../lib/GameMove/layoutPreference";

/**
 * Beta play page is logged-in only. On refresh/HMR, globalMe starts null until
 * Navbar auth finishes — wait for Cognito before redirecting to classic.
 */
function GameMoveBetaWrapper() {
  const params = useParams();
  const location = useLocation();
  const globalMe = useStore((state) => state.globalMe);
  const [sessionState, setSessionState] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        await Auth.currentAuthenticatedUser();
        if (!cancelled) {
          setSessionState("authed");
        }
      } catch {
        if (!cancelled) {
          setSessionState("anonymous");
        }
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

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
    return <Navigate to={classicPath} replace state={location.state} />;
  }

  if (globalMe === null) {
    return <Spinner />;
  }

  if (!globalMe?.id) {
    return <Navigate to={classicPath} replace state={location.state} />;
  }

  return (
    <GameMoveBetaShell
      key={`${params.metaGame}-${params.gameID}-${location.search}`}
    />
  );
}

export default GameMoveBetaWrapper;
