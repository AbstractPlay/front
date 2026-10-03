import { GameFactory } from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../../Bots/botUtils";
import { resolveCustomButtonLabel } from "../../../lib/customButtonLabel";
import {
  isPlayerIndexOnMove,
  tickActivePlayerRemainingMs,
} from "../../../lib/gameClockDisplay";

export function safeGetButtons(engine) {
  try {
    return engine?.getButtons?.() ?? [];
  } catch {
    return [];
  }
}

export function showMilliseconds(ms) {
  let positive = true;
  if (ms < 0) {
    ms = -ms;
    positive = false;
  }
  let seconds = ms / 1000;
  const days = Math.floor(seconds / (24 * 3600));
  seconds = seconds % (24 * 3600);
  const hours = parseInt(seconds / 3600, 10);
  seconds = seconds % 3600;
  const minutes = parseInt(seconds / 60, 10);
  seconds = seconds % 60;
  let output = "";
  if (!positive) output = "-";
  if (days > 0) output += `${days}d, `;
  if (days > 0 || hours > 0) output += `${hours}h`;
  if (days < 1) {
    if (days > 0 || hours > 0) output += ", ";
    if (minutes > 0) output += `${minutes}m`;
    if (hours < 1) {
      if (minutes > 0) output += ", ";
      output += `${Math.round(seconds)}s`;
    }
  }
  return output;
}

export function getFocusNode(exp, game, foc) {
  let curNode = exp[foc.moveNumber];
  if (curNode.state === null) {
    const tmpEngine = GameFactory(game.metaGame, game.state);
    tmpEngine.stack = tmpEngine.stack.slice(0, foc.moveNumber + 1);
    tmpEngine.load();
    curNode.state = tmpEngine.cheapSerialize();
  }
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

export function sortLenAlpha(a, b) {
  if (a.length === b.length) {
    return a.localeCompare(b);
  }
  return a.length - b.length;
}

/** API `toMove` is often string "0"/"1"; exploration nodes use numbers. */
export { isPlayerIndexOnMove } from "../../../lib/gameClockDisplay";

export function getPlayerClockChips(game, toMove, users, now = Date.now()) {
  if (!game?.players || toMove === "") return [];
  return game.players.map((p, ind) => {
    const active = isPlayerIndexOnMove(ind, toMove);
    const ms = tickActivePlayerRemainingMs(p, game, toMove, ind, now);
    return {
      key: ind,
      playerId: p.id,
      label: formatPlayerDisplayName(p, users),
      time: showMilliseconds(ms),
      active,
      clockPaused: active && p.clockPaused === true,
      onVacation: p.onVacation === true,
    };
  });
}

/** Live clock display; ignores exploration / history focus. */
export function getLivePlayerClockChips(game, users, now = Date.now()) {
  if (!game) return [];
  return getPlayerClockChips(game, game.toMove, users, now);
}

export function NoMoves({ engine, game, handleMove, t }) {
  const elements = [];
  if (game.customButtons) {
    safeGetButtons(engine).forEach(({ label, move }, idx) => {
      elements.push(
        <div className="control" key={`MoveButton|${idx}`}>
          <button
            type="button"
            className="button is-small apButton"
            onClick={() => handleMove(move)}
          >
            {resolveCustomButtonLabel(label, t)}
          </button>
        </div>
      );
    });
  }

  if (elements.length === 0) {
    return null;
  }

  return <div className="game-move-dock-entry__no-moves">{elements}</div>;
}
