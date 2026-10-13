/**
 * Lab playground export from hex-b058 replay fixture + exploration tip tree.
 * Refresh committed bin snapshot (manual only):
 *
 *   AP_WRITE_HEX_B058_SNAPSHOT=1 npx vitest run src/lib/GameMove/hexB058PlaygroundSnapshot.integration.test.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/Lab/GameTree";
import {
  PLAYGROUND_EXPORT_FORMAT,
  serializePlaygroundExport,
} from "../Lab/export";
import { materializeMainLineSpineStates } from "../Lab/exploration";
import { applyExplorationMove } from "./explorationMoves";
import hexB058 from "./fixtures/replays/hex-b058.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(__dirname, "../../..");

const TIP_TREE_CHILDREN = hexB058.explorationRows[0].tree;

function buildMainLineHistory(metaGame, stateStr, gameOver, winner) {
  const tmpEngine = GameFactory(metaGame, stateStr);
  const history = [];
  while (true) {
    history.unshift(
      new GameNode(
        null,
        tmpEngine.lastmove ?? "",
        null,
        tmpEngine.gameover ? "" : tmpEngine.currplayer - 1
      )
    );
    if (gameOver && winner.length === 1) {
      history[0].outcome = winner[0] - 1;
    }
    tmpEngine.stack.pop();
    tmpEngine.gameover = false;
    tmpEngine.winner = [];
    if (tmpEngine.stack.length === 0) break;
    tmpEngine.load();
  }
  return history;
}

function inflateBranches(node, children, metaGame) {
  const engine = GameFactory(metaGame, node.state);
  for (const n of children) {
    if (!n?.move) continue;
    applyExplorationMove(engine, n.move, { metaGame });
    const pos = node.AddChild(n.move, engine);
    const child = node.children[pos];
    if (n.premove) child.premove = true;
    if (n.children?.length) {
      inflateBranches(child, n.children, metaGame);
    }
  }
}

function attachTipBranches(history, metaGame) {
  const node = history[history.length - 1];
  inflateBranches(node, TIP_TREE_CHILDREN, metaGame);
}

describe("hex b058 playground snapshot", () => {
  it("matches tip branch layout for move table checks", () => {
    const game = hexB058.game;
    expect(game?.state).toBeTruthy();

    const engine = GameFactory(game.metaGame, game.state);
    const gameRef = {
      metaGame: game.metaGame,
      state: game.state,
      numPlayers: game.numPlayers,
      simultaneous: false,
      gameOver: engine.gameover,
      selectedVariants: game.selectedVariants ?? [],
    };

    const history = buildMainLineHistory(
      game.metaGame,
      game.state,
      gameRef.gameOver,
      engine.winner
    );
    materializeMainLineSpineStates(history, game.metaGame, game.state);
    attachTipBranches(history, game.metaGame);

    const focus = { moveNumber: history.length - 1, exPath: [] };
    const json = serializePlaygroundExport(gameRef, history, focus);
    const obj = JSON.parse(json);
    expect(obj.format).toBe(PLAYGROUND_EXPORT_FORMAT);
    expect(obj.exploration?.at(-1)?.length).toBe(2);

    if (process.env.AP_WRITE_HEX_B058_SNAPSHOT === "1") {
      const outPath = path.join(
        frontRoot,
        "bin/fixtures/hex-b058-playground.snapshot.json"
      );
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, json, "utf8");
      // eslint-disable-next-line no-console
      console.log(`\nWrote ${outPath}\n`);
    }
  });
});
