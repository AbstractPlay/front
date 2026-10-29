import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { arenaPlayPath } from "../../lib/arena/arenaRoutes";
import { readArenaTableLayoutChoice } from "./ArenaTableLayoutPicker";

/** Navigates seated arena players to play when the server pushes `arena_launch`. */
export default function ArenaLaunchListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const onLaunch = (event) => {
      const { metaGame, gameId } = event.detail ?? {};
      if (!metaGame || !gameId) {
        return;
      }
      const layout = readArenaTableLayoutChoice();
      navigate(arenaPlayPath(metaGame, gameId, { layout }), { replace: true });
    };
    window.addEventListener("arena-launch", onLaunch);
    return () => window.removeEventListener("arena-launch", onLaunch);
  }, [navigate]);

  return null;
}
