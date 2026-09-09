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
import PageLoading from "./shared/PageLoading";

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

function GameMoveShell() {
  const params = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { layoutId, resolvedFrom } = useGameMoveLayout();
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const sessionTrackedRef = useRef(null);

  const session = useGameMoveSession({
    routerState: location.state,
    moveBasePath: MOVE_BASE,
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
      storedLayout: readLayoutPreference(),
    });
  }, [
    session.isGameLoading,
    params.metaGame,
    params.gameID,
    layoutId,
    resolvedFrom,
  ]);

  if (session.isGameLoading) {
    return <PageLoading message={t("gameMove.loading")} />;
  }

  return (
    <LayoutPickerProvider value={pickerValue}>
      <div className="game-move-shell">
        <GameMoveLayout
          key={`${params.metaGame}-${params.gameID}-${layoutId}`}
          session={session}
          layoutId={layoutId}
        />
        <LayoutPickerModal
          show={showLayoutPicker}
          onClose={closeLayoutPicker}
          layoutId={layoutId}
        />
      </div>
    </LayoutPickerProvider>
  );
}

export default GameMoveShell;
