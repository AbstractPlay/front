import { Link } from "react-router-dom";
import { isArenaGame } from "../../../lib/arena/arenaGame";
import PlayerColourChip from "./PlayerColourChip";
import LastMoveChip from "./LastMoveChip";
import LayoutPickerTrigger from "../LayoutPickerTrigger";
import LiveClockPanel from "./LiveClockPanel";

const MOBILE_PANEL_MAX_WIDTH = 768;
/** Matches `.game-move-layout--live` sidebar grid breakpoint in index.css */
export const LIVE_SIDEBAR_BREAKPOINT = 900;

function LiveContextBar({ session, layoutContext, showClocks = true }) {
  const { t, game, metaGame } = session;
  const compact =
    (session.screenWidth ?? MOBILE_PANEL_MAX_WIDTH) <= MOBILE_PANEL_MAX_WIDTH;
  const arena = isArenaGame(game);

  const {
    gameName,
    parenthetical,
    queueCount,
    lastMoveNotation,
    lastMovePlayerName,
    myColourLabel,
    myColour,
    moveNumber,
  } = layoutContext;

  return (
    <header className="game-move-live-context">
      <div className="game-move-live-context__meta">
        <div className="game-move-live-context__title-row">
          <span className="game-move-live-context__game">
            <strong>
              <Link to={`/games/${metaGame}`}>{gameName}</Link>
            </strong>
            {parenthetical.length === 0 ? null : (
              <span className="game-move-live-context__parenthetical">
                {" "}
                ({parenthetical.reduce((a, b) => [a, ", ", b])})
              </span>
            )}
          </span>
          <LayoutPickerTrigger compact={compact} />
        </div>
        <div className="game-move-live-context__chips">
          {myColourLabel ? (
            <PlayerColourChip colour={myColour} label={myColourLabel} />
          ) : null}
          {!arena && queueCount > 0 ? (
            <span className="game-move-live-context__chip">
              {t("gameMove.layout.queueWaiting", { count: queueCount })}
            </span>
          ) : null}
          <span className="game-move-live-context__chip">
            {t("gameMove.layout.movePly", { n: moveNumber })}
          </span>
          {lastMoveNotation ? (
            <LastMoveChip
              t={t}
              lastMoveNotation={lastMoveNotation}
              lastMovePlayerName={lastMovePlayerName}
            />
          ) : null}
        </div>
      </div>
      {showClocks ? (
        <div className="game-move-live-context__clocks">
          <LiveClockPanel session={session} variant="inline" />
        </div>
      ) : null}
    </header>
  );
}

export default LiveContextBar;
