import { useEffect } from "react";
import { addResource } from "@abstractplay/gameslib";

function GamesLibLocaleSync() {
  useEffect(() => {
    addResource();
  }, []);

  return null;
}

export default GamesLibLocaleSync;
