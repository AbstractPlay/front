import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../stores";
import { collectWatchGames, gamesWatchKey } from "../lib/watchGames";
import { scheduleWatchGamesSync } from "../lib/wsWatchSync";

export default function useGameWatch() {
  const globalMe = useStore((state) => state.globalMe);
  const wsSend = useStore((state) => state.wsSend);
  const setDesiredWatchGames = useStore((state) => state.setDesiredWatchGames);
  const location = useLocation();

  const games = useMemo(
    () => collectWatchGames(globalMe, location.pathname),
    [globalMe, location.pathname]
  );

  const gamesKey = useMemo(() => gamesWatchKey(games), [games]);

  useEffect(() => {
    setDesiredWatchGames(JSON.parse(gamesKey));
    scheduleWatchGamesSync();
  }, [gamesKey, setDesiredWatchGames]);

  useEffect(() => {
    if (!wsSend) {
      return;
    }
    scheduleWatchGamesSync();
  }, [wsSend]);
}
