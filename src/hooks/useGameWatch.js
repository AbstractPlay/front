import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../stores";

function isActiveGame(game) {
  if (Array.isArray(game.toMove)) {
    return (game.players?.length ?? 0) > 0;
  }
  return game.toMove !== "" && game.toMove !== null;
}

function collectWatchGames(globalMe, pathname) {
  const keys = new Map();

  if (globalMe?.games) {
    for (const game of globalMe.games) {
      if (!isActiveGame(game)) {
        continue;
      }
      if (game.metaGame && game.id) {
        keys.set(`${game.metaGame}#${game.id}`, {
          meta: game.metaGame,
          id: game.id,
        });
      }
    }
  }

  const routeMatch = pathname.match(/^\/move\/([^/]+)\/[^/]+\/([^/]+)/);
  if (routeMatch) {
    const meta = routeMatch[1];
    const id = routeMatch[2];
    keys.set(`${meta}#${id}`, { meta, id });
  }

  return [...keys.values()];
}

export default function useGameWatch() {
  const globalMe = useStore((state) => state.globalMe);
  const wsSend = useStore((state) => state.wsSend);
  const location = useLocation();

  const games = useMemo(
    () => collectWatchGames(globalMe, location.pathname),
    [globalMe, location.pathname]
  );

  const gamesKey = useMemo(() => JSON.stringify(games), [games]);

  useEffect(() => {
    if (!wsSend) {
      return;
    }
    wsSend("watchGames", { games: JSON.parse(gamesKey) });
  }, [wsSend, gamesKey]);
}
