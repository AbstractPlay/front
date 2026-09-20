import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHelmet from "../PageHelmet";
import { buildLabGame } from "../../lib/Lab/buildGame";
import {
  clearLastSession,
  getLastLauncherMetaGame,
  getLastSession,
  localSaveToLaunchPayload,
  saveLastLauncherMetaGame,
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
  const { t } = useTranslation();
  const [session, setSession] = useState(null);
  const [launcherMetaGame, setLauncherMetaGame] = useState(() =>
    getLastLauncherMetaGame(),
  );
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

  const documentTitle = useMemo(() => {
    if (!session) {
      return t("lab.launcherPageTitle");
    }
    return `${session.sessionName}${t("lab.titleSuffix")}`;
  }, [session, t]);

  const rememberLauncherMetaGame = useCallback((metaGame) => {
    if (!metaGame) {
      return;
    }
    saveLastLauncherMetaGame(metaGame);
    setLauncherMetaGame(metaGame);
  }, []);

  const handleLaunch = useCallback(
    ({
      game,
      savedExploration,
      savedMoveAnnotations,
      initialFocus,
      gameSettings,
      sessionName,
    }) => {
      rememberLauncherMetaGame(game?.metaGame);
      setSession({
        game,
        savedExploration,
        savedMoveAnnotations: savedMoveAnnotations ?? null,
        initialFocus: initialFocus ?? null,
        gameSettings,
        sessionName,
        loadedSave: null,
      });
    },
    [rememberLauncherMetaGame],
  );

  const handleLoadSave = useCallback(
    (save) => {
      try {
        const payload = launchPayloadFromSave(save);
        rememberLauncherMetaGame(payload.game?.metaGame);
        setSession(payload);
      } catch (err) {
        window.alert(err.message || String(err));
      }
    },
    [rememberLauncherMetaGame],
  );

  const handleLoadedSaveChange = useCallback((loadedSave) => {
    setSession((prev) => (prev ? { ...prev, loadedSave } : prev));
  }, []);

  const handleSessionNameChange = useCallback((sessionName) => {
    setSession((prev) => (prev ? { ...prev, sessionName } : prev));
  }, []);

  const handleExit = useCallback(() => {
    rememberLauncherMetaGame(session?.game?.metaGame);
    clearLastSession();
    setSession(null);
  }, [rememberLauncherMetaGame, session]);

  if (!ready) {
    return null;
  }

  return (
    <>
      <PageHelmet title={documentTitle} />
      {session ? (
        <LabSession
          initialGame={session.game}
          savedExploration={session.savedExploration}
          savedMoveAnnotations={session.savedMoveAnnotations}
          initialFocus={session.initialFocus}
          initialGameSettings={session.gameSettings}
          sessionName={session.sessionName}
          loadedSave={session.loadedSave}
          onLoadedSaveChange={handleLoadedSaveChange}
          onSessionNameChange={handleSessionNameChange}
          onExit={handleExit}
        />
      ) : (
        <LabLauncher
          initialMetaGame={launcherMetaGame}
          onLaunch={handleLaunch}
          onLoadSave={handleLoadSave}
        />
      )}
    </>
  );
}

export default Lab;
