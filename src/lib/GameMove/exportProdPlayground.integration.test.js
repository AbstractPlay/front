/**
 * Build a Lab playground paste payload from prod game + private exploration.
 *
 *   AP_EXPORT_PLAYGROUND=1 npx vitest run src/lib/GameMove/exportProdPlayground.integration.test.js
 *
 * Writes bin/out/<gameId>-playground.json (gitignored). Paste into Lab launcher
 * “Load pasted state”, or use the JSON in DevTools:
 *   import { parsePlaygroundImport } from './src/lib/Lab/export.js' …
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { describe, expect, it, vi } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/Lab/GameTree";
import { serializePlaygroundExport, PLAYGROUND_EXPORT_FORMAT } from "../Lab/export";
import { materializeMainLineSpineStates } from "../Lab/exploration";
import * as explorationApi from "./exploration";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(__dirname, "../../..");

const GAME_ID = "8a8e2d42-a0ae-4366-834d-fc476f52adca";
const API = "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/prod/query";

function loadEnvLocal() {
  const envPath = path.join(frontRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseApPostBody(stdout) {
  const marker = "--- body ---";
  const idx = stdout.indexOf(marker);
  if (idx < 0) return null;
  const raw = stdout.slice(idx + marker.length).trim();
  if (!raw || raw === "(empty)") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fetchPrivateExplorationProd() {
  const reqPath = path.join(
    frontRoot,
    "bin/requests/get-private-exploration-hex-b058.json"
  );
  const result = spawnSync(
    process.execPath,
    ["bin/ap-auth-post.mjs", reqPath, "--stage", "prod"],
    {
      cwd: frontRoot,
      env: process.env,
      encoding: "utf8",
    }
  );
  if (result.status !== 0) {
    throw new Error(
      `ap-auth-post failed (status ${result.status}): ${result.stderr || result.stdout}`
    );
  }
  const parsed = parseApPostBody(result.stdout);
  if (!parsed?.data) {
    throw new Error("get_private_exploration response missing data");
  }
  return parsed.data.map((d) => {
    if (d && typeof d.tree === "string") {
      return { ...d, tree: JSON.parse(d.tree) };
    }
    return d;
  });
}

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

const runExport = process.env.AP_EXPORT_PLAYGROUND === "1";

describe.runIf(runExport)("export prod hex to Lab playground JSON", () => {
  it("writes abstractplay-playground export for paste import", async () => {
    loadEnvLocal();
    vi.spyOn(explorationApi, "saveExploration").mockResolvedValue(undefined);

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "get_game",
        pars: { metaGame: "hex", id: GAME_ID, cbit: 0 },
      }),
    });
    const { game } = await res.json();
    expect(game?.state).toBeTruthy();

    const privateRows = fetchPrivateExplorationProd();
    expect(privateRows.length).toBeGreaterThan(0);

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

    explorationApi.mergePrivateExploration(
      gameRef,
      history,
      privateRows,
      0,
      () => {},
      { current: "" }
    );

    materializeMainLineSpineStates(history, game.metaGame, game.state);

    const focus = { moveNumber: history.length - 1, exPath: [] };
    const json = serializePlaygroundExport(gameRef, history, focus);
    const obj = JSON.parse(json);
    expect(obj.format).toBe(PLAYGROUND_EXPORT_FORMAT);
    expect(obj.exploration).toBeTruthy();

    const outDir = path.join(frontRoot, "bin/out");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${GAME_ID}-playground.json`);
    fs.writeFileSync(outPath, json, "utf8");
    // eslint-disable-next-line no-console
    console.log(`\nWrote ${outPath}\nPaste into Lab → Load pasted state.\n`);
  });
});
