import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHelmet from "../PageHelmet";
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
  const { t } = useTranslation();
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

  const documentTitle = useMemo(() => {
    if (!session) {
      return t("lab.launcherPageTitle");
    }
    return `${session.sessionName}${t("lab.titleSuffix")}`;
  }, [session, t]);

  const handleLaunch = useCallback(
    ({
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
    },
    []
  );

  const handleLoadSave = useCallback((save) => {
    try {
      setSession(launchPayloadFromSave(save));
    } catch (err) {
      window.alert(err.message || String(err));
    }
  }, []);

  const handleLoadedSaveChange = useCallback((loadedSave) => {
    setSession((prev) => (prev ? { ...prev, loadedSave } : prev));
  }, []);

  const handleSessionNameChange = useCallback((sessionName) => {
    setSession((prev) => (prev ? { ...prev, sessionName } : prev));
  }, []);

  const handleExit = useCallback(() => {
    clearLastSession();
    setSession(null);
  }, []);

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
        <LabLauncher onLaunch={handleLaunch} onLoadSave={handleLoadSave} />
      )}
    </>
  );
}

export default Lab;
