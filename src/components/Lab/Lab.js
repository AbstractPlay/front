import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { resolveMetaGameUid } from "../../lib/gameOptions";
import {
  buildLabGame,
  isLabSupportedGame,
} from "../../lib/Lab/buildGame";
import {
  buildFreshPlaygroundSession,
  playgroundNeedsLauncherSetup,
} from "../../lib/Lab/playgroundLaunch";
import PageHelmet from "../PageHelmet";
import ChallengeEntryModals from "../ChallengeEntryModals";
import { submitNewChallenge } from "../../lib/submitNewChallenge";
import { useStore } from "../../stores";
import { readSimRoundFromGameSettings } from "../../lib/Lab/labSimBoardSettings";
import {
  clearImportCheckpoint,
  clearLastSession,
  getImportCheckpoint,
  getLastLauncherMetaGame,
  getLastSession,
  localSaveToLaunchPayload,
  saveLastLauncherMetaGame,
} from "../../lib/Lab/storage";
import LabLauncher from "./LabLauncher";
import LabSession from "./LabSession";

function simOptionsFromSettings(gameSettings) {
  const sim = readSimRoundFromGameSettings(gameSettings);
  return {
    activeSeat: sim.activeSeat,
    simPartialMove: sim.simPartialMove,
    simToMove: sim.simToMove,
  };
}

function sessionStateFromPersistedPayload(last) {
  const gameSettings = last.gameSettings ?? {};
  const game = buildLabGame(last.metaGame, last.state, {
    variants: last.variants ?? [],
    numPlayers: last.playerCount,
    ...simOptionsFromSettings(gameSettings),
  });
  game.id = last.id ?? nanoid();
  game.selectedVariants = last.variants ?? [];
  return {
    game,
    savedExploration: last.exploration ?? null,
    savedMoveAnnotations: last.moveAnnotations ?? null,
    initialFocus: last.focus ?? null,
    gameSettings,
    sessionName: last.name,
    loadedSave: last.loadedSave ?? null,
    sessionKey: nanoid(),
  };
}

function sessionFromAutosave(last) {
  return sessionStateFromPersistedPayload(last);
}

function wrapLaunchSession(sessionFields) {
  return {
    ...sessionFields,
    sessionKey: nanoid(),
  };
}

function launchPayloadFromSave(save) {
  const payload = save.source != null ? save : localSaveToLaunchPayload(save);
  const gameSettings = payload.gameSettings ?? {};
  const game = buildLabGame(payload.metaGame, payload.state, {
    variants: payload.variants ?? [],
    numPlayers: payload.playerCount,
    ...simOptionsFromSettings(gameSettings),
  });
  game.id = payload.id;
  game.selectedVariants = payload.variants ?? [];
  return wrapLaunchSession({
    game,
    savedExploration: payload.exploration,
    savedMoveAnnotations: payload.moveAnnotations ?? null,
    initialFocus: payload.focus ?? null,
    gameSettings,
    sessionName: payload.name,
    loadedSave: {
      id: payload.id,
      name: payload.name,
      source: payload.source ?? "local",
    },
  });
}

function Lab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [session, setSession] = useState(null);
  const [challengeModalOpen, challengeModalOpenSetter] = useState(false);
  const [challengeDraft, challengeDraftSetter] = useState(null);
  const [launcherMetaGame, setLauncherMetaGame] = useState(() =>
    getLastLauncherMetaGame(),
  );
  const [launcherError, setLauncherError] = useState("");
  const [ready, setReady] = useState(false);
  const [hasImportCheckpoint, hasImportCheckpointSetter] = useState(() =>
    Boolean(getImportCheckpoint()),
  );

  useEffect(() => {
    const rawMetaGame = new URLSearchParams(window.location.search).get(
      "metaGame",
    );
    const hasDeepLink =
      typeof rawMetaGame === "string" && rawMetaGame.length > 0;

    if (hasDeepLink) {
      const resolved = resolveMetaGameUid(rawMetaGame);
      if (!resolved || !isLabSupportedGame(resolved)) {
        setLauncherError(t("lab.launchMetaGameInvalid"));
      } else {
        saveLastLauncherMetaGame(resolved);
        setLauncherMetaGame(resolved);
        if (!playgroundNeedsLauncherSetup(resolved)) {
          try {
            const fresh = buildFreshPlaygroundSession(resolved);
            clearImportCheckpoint();
            setSession(
              wrapLaunchSession({
                ...fresh,
                savedMoveAnnotations: null,
                initialFocus: null,
                loadedSave: null,
              }),
            );
          } catch (err) {
            setLauncherError(err.message || String(err));
          }
        }
      }
      navigate("/playground", { replace: true });
    } else {
      const last = getLastSession();
      if (last?.metaGame && last?.state) {
        try {
          setSession(sessionFromAutosave(last));
        } catch (err) {
          console.error("Failed to restore Playground session:", err);
          clearLastSession();
        }
      }
    }
    hasImportCheckpointSetter(Boolean(getImportCheckpoint()));
    setReady(true);
    // Mount-only: read query from location so replace navigation does not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional once on load
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
      preserveImportCheckpoint = false,
    }) => {
      rememberLauncherMetaGame(game?.metaGame);
      if (!preserveImportCheckpoint) {
        clearImportCheckpoint();
        hasImportCheckpointSetter(false);
      } else {
        hasImportCheckpointSetter(Boolean(getImportCheckpoint()));
      }
      setSession(
        wrapLaunchSession({
          game,
          savedExploration,
          savedMoveAnnotations: savedMoveAnnotations ?? null,
          initialFocus: initialFocus ?? null,
          gameSettings,
          sessionName,
          loadedSave: null,
        }),
      );
    },
    [rememberLauncherMetaGame],
  );

  const handleLoadSave = useCallback(
    (save) => {
      try {
        const payload = launchPayloadFromSave(save);
        rememberLauncherMetaGame(payload.game?.metaGame);
        clearImportCheckpoint();
        hasImportCheckpointSetter(false);
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
    clearImportCheckpoint();
    hasImportCheckpointSetter(false);
    setSession(null);
  }, [rememberLauncherMetaGame, session]);

  const handleResetToImport = useCallback(() => {
    const cp = getImportCheckpoint();
    if (!cp?.metaGame || !cp?.state) {
      return;
    }
    try {
      setSession(sessionStateFromPersistedPayload({
        ...cp,
        loadedSave: null,
      }));
      hasImportCheckpointSetter(true);
    } catch (err) {
      window.alert(err.message || String(err));
    }
  }, []);

  const handleClearGame = useCallback(() => {
    if (!session?.game) {
      return;
    }
    const { game, gameSettings, sessionName } = session;
    try {
      const fresh = buildLabGame(game.metaGame, null, {
        variants: game.selectedVariants ?? [],
        numPlayers: game.numPlayers,
        ...simOptionsFromSettings(gameSettings ?? {}),
      });
      fresh.id = nanoid();
      fresh.selectedVariants = game.selectedVariants ?? [];
      setSession(
        wrapLaunchSession({
          game: fresh,
          savedExploration: null,
          savedMoveAnnotations: null,
          initialFocus: null,
          gameSettings: gameSettings ?? {},
          sessionName,
          loadedSave: null,
        }),
      );
    } catch (err) {
      window.alert(err.message || String(err));
    }
  }, [session]);

  const handleChallengeFromPosition = useCallback((draft) => {
    challengeDraftSetter(draft);
    challengeModalOpenSetter(true);
  }, []);

  const closeChallengeModal = useCallback(() => {
    challengeModalOpenSetter(false);
    challengeDraftSetter(null);
  }, []);

  const handleIssuePositionChallenge = useCallback(
    async (challenge) => {
      const parsed = await submitNewChallenge(challenge, globalMe, allUsers);
      if (!parsed.ok) {
        return parsed;
      }
      closeChallengeModal();
      return parsed;
    },
    [globalMe, allUsers, closeChallengeModal]
  );

  if (!ready) {
    return null;
  }

  return (
    <>
      <PageHelmet title={documentTitle} />
      {session ? (
        <>
          <LabSession
            key={session.sessionKey}
            initialGame={session.game}
            savedExploration={session.savedExploration}
            savedMoveAnnotations={session.savedMoveAnnotations}
            initialFocus={session.initialFocus}
            initialGameSettings={session.gameSettings}
            sessionName={session.sessionName}
            loadedSave={session.loadedSave}
            hasImportCheckpoint={hasImportCheckpoint}
            onLoadedSaveChange={handleLoadedSaveChange}
            onSessionNameChange={handleSessionNameChange}
            onExit={handleExit}
            onResetToImport={handleResetToImport}
            onClearGame={handleClearGame}
            onChallengeFromPosition={
              globalMe?.id ? handleChallengeFromPosition : undefined
            }
          />
          <ChallengeEntryModals
            show={challengeModalOpen}
            handleClose={closeChallengeModal}
            handleChallenge={handleIssuePositionChallenge}
            fixedMetaGame={challengeDraft?.metaGame}
            initialVariantUids={challengeDraft?.variants}
            initialStartPosition={challengeDraft?.state}
            lockTeachingFromPosition={Boolean(challengeDraft?.state)}
          />
        </>
      ) : (
        <LabLauncher
          initialMetaGame={launcherMetaGame}
          initialError={launcherError}
          onLaunch={handleLaunch}
          onLoadSave={handleLoadSave}
        />
      )}
    </>
  );
}

export default Lab;
