import { GameFactory } from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../../Bots/botUtils";

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

export function getPlayerClockChips(game, toMove, users, now = Date.now()) {
  if (!game?.players || toMove === "") return [];
  return game.players.map((p, ind) => {
    const active = Array.isArray(toMove) ? toMove[ind] : ind === toMove;
    const ms = active ? p.time - (now - game.lastMoveTime) : p.time;
    return {
      key: ind,
      label: formatPlayerDisplayName(p, users),
      time: showMilliseconds(ms),
      active,
    };
  });
}

export function NoMoves({ engine, game, handleMove, t }) {
  const elements = [];
  if (game.customRandom) {
    elements.push(
      <div className="control" key="random">
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={() => handleMove(engine.randomMove())}
        >
          Random move
        </button>
      </div>
    );
  }

  if (game.customButtons) {
    safeGetButtons(engine).forEach(({ label, move }, idx) => {
      elements.push(
        <div className="control" key={`MoveButton|${idx}`}>
          <button
            type="button"
            className="button is-small apButton"
            onClick={() => handleMove(move)}
          >
            {t(`buttons.${label}`)}
          </button>
        </div>
      );
    });
  }

  if (elements.length === 0) {
    return <div />;
  }

  return <div className="game-move-dock-entry__no-moves">{elements}</div>;
}
