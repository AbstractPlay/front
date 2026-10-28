import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameMoveSession } from "./GameMove/useGameMoveSession";
import { useGameMoveLayout } from "../hooks/useGameMoveLayout";
import {
  LAYOUT_CARD,
  LAYOUT_CLASSIC,
  LAYOUT_NARRATIVE,
  LAYOUT_STRIP,
  MOVE_BASE,
  readLayoutPreference,
} from "../lib/GameMove/layoutPreference";
import { trackLayoutSessionStart } from "../lib/GameMove/layoutTracking";
import GameMoveClassicLayout from "./GameMove/GameMoveClassicLayout";
import GameMoveStripLayout from "./GameMove/layouts/GameMoveStripLayout";
import GameMoveCardLayout from "./GameMove/layouts/GameMoveCardLayout";
import GameMoveNarrativeLayout from "./GameMove/layouts/GameMoveNarrativeLayout";
import { LayoutPickerProvider } from "./GameMove/LayoutPickerContext";
import LayoutPickerModal from "./GameMove/LayoutPickerModal";
import BoardExportGifModal from "./BoardExport/BoardExportGifModal";
import PageLoading from "./shared/PageLoading";
import ReplayModeBanner from "./GameMove/ReplayModeBanner";
import ArenaFeedbackModal from "./Arena/ArenaFeedbackModal";
import MoveTreeMobileChrome from "./GameMove/MoveTreeMobileChrome";
import { isGameMoveReplayEnabled } from "../lib/GameMove/replay/replayEnabled";
import { activateReplayFromSearchParams } from "../lib/GameMove/replay/shimEntry.js";

function GameMoveLayout({ session, layoutId }) {
  switch (layoutId) {
    case LAYOUT_CLASSIC:
      return <GameMoveClassicLayout session={session} />;
    case LAYOUT_CARD:
      return <GameMoveCardLayout session={session} />;
    case LAYOUT_NARRATIVE:
      return <GameMoveNarrativeLayout session={session} />;
    case LAYOUT_STRIP:
    default:
      return <GameMoveStripLayout session={session} />;
  }
}

function GameMoveShell({
  moveBasePath,
  submitMoveQuery,
  arenaLiveClock,
}) {
  const params = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { layoutId, resolvedFrom, playContext } = useGameMoveLayout();
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const sessionTrackedRef = useRef(null);
  const [replayGate, setReplayGate] = useState(() => {
    if (!isGameMoveReplayEnabled()) {
      return "ready";
    }
    const slug = new URLSearchParams(location.search).get("replay")?.trim();
    return slug ? "loading" : "ready";
  });

  useEffect(() => {
    if (!isGameMoveReplayEnabled()) {
      setReplayGate("ready");
      return;
    }
    const slug = new URLSearchParams(location.search).get("replay")?.trim();
    if (!slug) {
      setReplayGate("ready");
      return;
    }
    setReplayGate("loading");
    activateReplayFromSearchParams(location.search)
      .then(() => setReplayGate("ready"))
      .catch(() => setReplayGate("error"));
  }, [location.search]);

  const session = useGameMoveSession({
    routerState: location.state,
    moveBasePath: moveBasePath ?? MOVE_BASE,
    submitMoveQuery,
    arenaLiveClock,
    replayReady: replayGate === "ready",
  });

  const openLayoutPicker = useCallback(() => {
    setShowLayoutPicker(true);
  }, []);

  const closeLayoutPicker = useCallback(() => {
    setShowLayoutPicker(false);
  }, []);

  const pickerValue = useMemo(
    () => ({
      layoutId,
      resolvedFrom,
      openLayoutPicker,
    }),
    [layoutId, resolvedFrom, openLayoutPicker]
  );

  useEffect(() => {
    if (session.isGameLoading || !params.metaGame) {
      return;
    }
    const trackKey = `${params.metaGame}-${params.gameID}-${layoutId}`;
    if (sessionTrackedRef.current === trackKey) {
      return;
    }
    sessionTrackedRef.current = trackKey;
    trackLayoutSessionStart({
      layoutId,
      resolvedFrom,
      metaGame: params.metaGame,
      storedLayout: readLayoutPreference(playContext),
    });
  }, [
    session.isGameLoading,
    params.metaGame,
    params.gameID,
    layoutId,
    resolvedFrom,
    playContext,
  ]);

  if (replayGate === "loading" || session.isGameLoading) {
    return <PageLoading message={t("gameMove.loading")} />;
  }

  if (replayGate === "error") {
    return (
      <p className="notification is-danger">{t("gameMove.replay.loadFailed")}</p>
    );
  }

  const {
    showBoardExportGif,
    showBoardExportGifSetter,
    handleExportBoardGif,
    boardExportPathFrames,
    boardExportBusy,
  } = session;

  return (
    <LayoutPickerProvider value={pickerValue}>
      <div className="game-move-shell">
        <ReplayModeBanner />
        <MoveTreeMobileChrome session={session} />
        <GameMoveLayout
          key={`${params.metaGame}-${params.gameID}-${layoutId}`}
          session={session}
          layoutId={layoutId}
        />
        <BoardExportGifModal
          show={showBoardExportGif}
          onClose={() => showBoardExportGifSetter(false)}
          onExport={handleExportBoardGif}
          pathFrames={boardExportPathFrames}
          busy={boardExportBusy}
          t={t}
        />
        <LayoutPickerModal
          show={showLayoutPicker}
          onClose={closeLayoutPicker}
          layoutId={layoutId}
        />
        {submitMoveQuery === "submit_arena_move" ? (
          <ArenaFeedbackModal
            game={session.game}
            metaGame={params.metaGame}
            gameId={params.gameID}
          />
        ) : null}
      </div>
    </LayoutPickerProvider>
  );
}

export default GameMoveShell;
