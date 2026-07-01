import React, { useEffect, useState } from "react";
import { buildLabGame } from "../../lib/Lab/buildGame";
import {
  clearLastSession,
  getLastSession,
} from "../../lib/Lab/storage";
import LabLauncher from "./LabLauncher";
import LabSession from "./LabSession";

function sessionFromAutosave(last) {
  const game = buildLabGame(last.metaGame, last.state, {
    variants: last.variants ?? [],
    numPlayers: last.playerCount,
  });
  game.id = last.id;
  game.selectedVariants = last.variants ?? [];
  return {
    game,
    savedExploration: last.exploration ?? null,
    initialFocus: last.focus ?? null,
    gameSettings: last.gameSettings ?? {},
    sessionName: last.name,
  };
}

function Lab() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const last = getLastSession();
    if (last?.metaGame && last?.state) {
      try {
        setSession(sessionFromAutosave(last));
      } catch (err) {
        console.error("Failed to restore Lab session:", err);
        clearLastSession();
      }
    }
    setReady(true);
  }, []);

  const handleLaunch = ({
    game,
    savedExploration,
    gameSettings,
    sessionName,
  }) => {
    setSession({
      game,
      savedExploration,
      initialFocus: null,
      gameSettings,
      sessionName,
    });
  };

  const handleLoadSave = (save) => {
    try {
      const game = buildLabGame(save.metaGame, save.state, {
        variants: save.variants ?? [],
        numPlayers: save.playerCount,
      });
      game.id = save.id;
      game.selectedVariants = save.variants ?? [];
      handleLaunch({
        game,
        savedExploration: save.exploration,
        gameSettings: save.gameSettings ?? {},
        sessionName: save.name,
      });
    } catch (err) {
      window.alert(err.message || String(err));
    }
  };

  const handleExit = () => {
    clearLastSession();
    setSession(null);
  };

  if (!ready) {
    return null;
  }

  if (session) {
    return (
      <LabSession
        initialGame={session.game}
        savedExploration={session.savedExploration}
        initialFocus={session.initialFocus}
        initialGameSettings={session.gameSettings}
        sessionName={session.sessionName}
        onExit={handleExit}
      />
    );
  }

  return <LabLauncher onLaunch={handleLaunch} onLoadSave={handleLoadSave} />;
}

export default Lab;
