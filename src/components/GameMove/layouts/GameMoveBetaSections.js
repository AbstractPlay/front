import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGameDisplayName } from "../../../lib/gameOptions";
import GameStatus from "../GameStatus";
import MoveEntry from "../MoveEntry";
import MiscButtons from "../MiscButtons";
import Board from "../Board";
import GameMoves from "../GameMoves";
import UserChats from "../UserChats";
import MoveResults from "../MoveResults";
import PlayerColourChip from "../preview/PlayerColourChip";
import QueueNavButtons from "../preview/QueueNavButtons";
import LastMoveChip from "../preview/LastMoveChip";
import { useDrawerChatUnread } from "../preview/useDrawerChatUnread";
import {
  buildBoardProps,
  buildGameMovesProps,
  buildGameStatusProps,
  buildMiscButtonsProps,
  buildMoveEntryProps,
  buildMoveResultsProps,
  buildUserChatsProps,
  hasStatusContent,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";

export function GameMoveBoardSection({ session, hideTitle = false }) {
  const { metaGame, parenthetical } = session;
  return (
    <div className="game-move-section game-move-section--board">
      {hideTitle ? null : (
        <h1 className="subtitle lined tourWelcome">
          <span>
            <Link to={`/games/${metaGame}`}>
              {getGameDisplayName(metaGame)}
            </Link>
            {parenthetical.length === 0 ? null : (
              <span style={{ fontSize: "smaller", padding: 0, margin: 0 }}>
                &nbsp;(
                {parenthetical.reduce((prev, curr) => [prev, ", ", curr])})
              </span>
            )}
          </span>
        </h1>
      )}
      <Board {...buildBoardProps(session)} />
    </div>
  );
}

export function GameMoveMoveSection({
  session,
  forceUndoRight = false,
  showMiscButtons = true,
}) {
  const { t } = session;
  return (
    <div className="game-move-section game-move-section--move">
      <h2 className="subtitle lined">
        <span>{t("MakeMove")}</span>
      </h2>
      <MoveEntry {...buildMoveEntryProps(session, { forceUndoRight })} />
      {showMiscButtons ? (
        <MiscButtons {...buildMiscButtonsProps(session)} />
      ) : null}
    </div>
  );
}

export function GameMoveStatusSection({ session }) {
  const { t } = session;
  if (!hasStatusContent(session)) return null;
  return (
    <div className="game-move-section game-move-section--status">
      <h2 className="subtitle lined">
        <span>{t("Status")}</span>
      </h2>
      <GameStatus {...buildGameStatusProps(session)} />
    </div>
  );
}

export function GameMoveMovesSection({ session, title }) {
  const { t, focus } = session;
  if (!focus) return null;
  return (
    <div className="game-move-section game-move-section--moves tourMoveList">
      <h2 className="subtitle lined">
        <span>{title ?? t("Moves")}</span>
      </h2>
      <GameMoves {...buildGameMovesProps(session)} />
    </div>
  );
}

export function GameMoveChatSection({ session }) {
  const { t, explorationVersion } = session;
  return (
    <div className="game-move-section game-move-section--chat tourChat">
      <h2 className="subtitle lined">
        <span>{t("GameSummary")}</span>
      </h2>
      <UserChats key={explorationVersion} {...buildUserChatsProps(session)} />
    </div>
  );
}

export function GameMoveLogSection({ session }) {
  const { t, focus } = session;
  if (!focus) return null;
  return (
    <div className="game-move-section game-move-section--log" id="fullChatLog">
      <h2 className="subtitle lined">
        <span>{t("gameMove.layout.eventLog")}</span>
      </h2>
      <MoveResults {...buildMoveResultsProps(session)} />
    </div>
  );
}

const DRAWER_TABS = ["status", "moves", "chat", "log"];

function resolveDrawerTab(session, preferredTab = "status") {
  if (preferredTab === "status" && hasStatusContent(session)) {
    return "status";
  }
  if (preferredTab === "status" && !hasStatusContent(session)) {
    return "moves";
  }
  return preferredTab;
}

export function GameMoveBetaDrawer({
  session,
  defaultTab = "status",
  defaultOpen = false,
}) {
  const { t } = session;
  const statusAvailable = hasStatusContent(session);
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState(() => resolveDrawerTab(session, defaultTab));
  const hasChatUnread = useDrawerChatUnread(session, { tab, open });

  useEffect(() => {
    setTab((current) => {
      if (defaultTab !== "status") {
        return current;
      }
      if (statusAvailable && current === "moves") {
        return "status";
      }
      if (!statusAvailable && current === "status") {
        return "moves";
      }
      return current;
    });
  }, [defaultTab, statusAvailable, session.game?.id]);

  const tabLabel = (id) => {
    switch (id) {
      case "status":
        return t("Status");
      case "moves":
        return t("Moves");
      case "chat":
        return t("GameSummary");
      case "log":
        return t("gameMove.layout.eventLog");
      default:
        return id;
    }
  };

  return (
    <div className={`game-move-beta-drawer${open ? " is-open" : ""}`}>
      <div className="game-move-beta-drawer__tabs" role="tablist">
        {DRAWER_TABS.map((id) => {
          if (id === "status" && !hasStatusContent(session)) return null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={open && tab === id}
              className={`button is-small game-move-beta-drawer__tab${
                open && tab === id ? " apButton" : " apButtonNeutral"
              }`}
              onClick={() => {
                if (open && tab === id) {
                  setOpen(false);
                } else {
                  setTab(id);
                  setOpen(true);
                }
              }}
            >
              {tabLabel(id)}
              {id === "chat" && hasChatUnread ? (
                <span
                  className="game-move-beta-drawer__tab-badge"
                  aria-label={t("gameMove.layout.chatUnread")}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {open ? (
        <div className="game-move-beta-drawer__panel" role="tabpanel">
          {tab === "status" ? (
            <GameMoveStatusSection session={session} />
          ) : null}
          {tab === "moves" ? <GameMoveMovesSection session={session} /> : null}
          {tab === "chat" ? <GameMoveChatSection session={session} /> : null}
          {tab === "log" ? <GameMoveLogSection session={session} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function GameMoveContextStrip({ session, layoutContext }) {
  const { t, handleNextGame, game } = session;
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
    <header className="game-move-context-strip">
      <div className="game-move-context-strip__primary">
        <span className="game-move-context-strip__game">
          <strong>{gameName}</strong>
          {parenthetical.length === 0 ? null : (
            <span className="game-move-context-strip__meta">
              {" "}
              ({parenthetical.reduce((a, b) => [a, ", ", b])})
            </span>
          )}
        </span>
        {myColourLabel ? (
          <PlayerColourChip colour={myColour} label={myColourLabel} />
        ) : null}
        {queueCount > 0 ? (
          <span className="game-move-context-strip__chip">
            {t("gameMove.layout.queueWaiting", { count: queueCount })}
          </span>
        ) : null}
        <span className="game-move-context-strip__chip">
          {t("gameMove.layout.movePly", { n: moveNumber })}
        </span>
      </div>
      <div className="game-move-context-strip__secondary">
        {lastMoveNotation ? (
          <LastMoveChip
            t={t}
            lastMoveNotation={lastMoveNotation}
            lastMovePlayerName={lastMovePlayerName}
          />
        ) : null}
        {game ? (
          <QueueNavButtons
            t={t}
            waitingCount={queueCount}
            onNextGame={handleNextGame}
          />
        ) : null}
      </div>
    </header>
  );
}

export function GameMoveLastMoveBlock({ layoutContext, t }) {
  const { lastMoveNotation, lastMovePlayerName } = layoutContext;
  if (!lastMoveNotation) return null;
  return (
    <div className="game-move-last-move-block">
      <LastMoveChip
        t={t}
        lastMoveNotation={lastMoveNotation}
        lastMovePlayerName={lastMovePlayerName}
        className="game-move-last-move-chip--block"
      />
    </div>
  );
}
