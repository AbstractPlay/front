import React, { useEffect, useState } from "react";
import { buildLabGame } from "../../lib/Lab/buildGame";
import {
  clearLastSession,
  getLastSession,
  localSaveToLaunchPayload,
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
    savedMoveAnnotations: last.moveAnnotations ?? null,
    initialFocus: last.focus ?? null,
    gameSettings: last.gameSettings ?? {},
    sessionName: last.name,
    loadedSave: last.loadedSave ?? null,
  };
}

function launchPayloadFromSave(save) {
  const payload = save.source != null ? save : localSaveToLaunchPayload(save);
  const game = buildLabGame(payload.metaGame, payload.state, {
    variants: payload.variants ?? [],
    numPlayers: payload.playerCount,
  });
  game.id = payload.id;
  game.selectedVariants = payload.variants ?? [];
  return {
    game,
    savedExploration: payload.exploration,
    savedMoveAnnotations: payload.moveAnnotations ?? null,
    initialFocus: payload.focus ?? null,
    gameSettings: payload.gameSettings ?? {},
    sessionName: payload.name,
    loadedSave: {
      id: payload.id,
      name: payload.name,
      source: payload.source ?? "local",
    },
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
        console.error("Failed to restore Playground session:", err);
        clearLastSession();
      }
    }
    setReady(true);
  }, []);

  const handleLaunch = ({
    game,
    savedExploration,
    savedMoveAnnotations,
    initialFocus,
    gameSettings,
    sessionName,
  }) => {
    setSession({
      game,
      savedExploration,
      savedMoveAnnotations: savedMoveAnnotations ?? null,
      initialFocus: initialFocus ?? null,
      gameSettings,
      sessionName,
      loadedSave: null,
    });
  };

  const handleLoadSave = (save) => {
    try {
      setSession(launchPayloadFromSave(save));
    } catch (err) {
      window.alert(err.message || String(err));
    }
  };

  const handleLoadedSaveChange = (loadedSave) => {
    setSession((prev) => (prev ? { ...prev, loadedSave } : prev));
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
        savedMoveAnnotations={session.savedMoveAnnotations}
        initialFocus={session.initialFocus}
        initialGameSettings={session.gameSettings}
        sessionName={session.sessionName}
        loadedSave={session.loadedSave}
        onLoadedSaveChange={handleLoadedSaveChange}
        onExit={handleExit}
      />
    );
  }

  return <LabLauncher onLaunch={handleLaunch} onLoadSave={handleLoadSave} />;
}

export default Lab;
