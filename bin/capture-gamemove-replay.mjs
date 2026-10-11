#!/usr/bin/env node
/**
 * Capture a Game Move replay bundle for local dev (?replay=slug).
 *
 * Usage (from front repo root):
 *   node bin/capture-gamemove-replay.mjs --slug hex-b058 --game-id <uuid> --meta-game hex --cbits 0 --view-as <playerUuid> [--stage prod] [--out path]
 *
 * Requires .env.local (AP_TEST_USER / AP_TEST_PASSWORD) for auth queries.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(__dirname, "..");

const OPEN_API = {
  prod: "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/prod/query",
  dev: "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/dev/query",
};

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

function parseArgs(argv) {
  const opts = {
    slug: "",
    gameId: "",
    metaGame: "",
    cbits: 0,
    viewAs: "",
    stage: process.env.AP_TEST_STAGE?.trim() || "prod",
    out: "",
    includePrivate: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") opts.slug = argv[++i];
    else if (a === "--game-id") opts.gameId = argv[++i];
    else if (a === "--meta-game") opts.metaGame = argv[++i];
    else if (a === "--cbits") opts.cbits = Number(argv[++i]);
    else if (a === "--view-as") opts.viewAs = argv[++i];
    else if (a === "--stage") opts.stage = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (a === "--no-private") opts.includePrivate = false;
  }
  return opts;
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

function authPost(query, pars, stage) {
  const reqPath = path.join(frontRoot, "bin/out/capture-replay-req.json");
  fs.mkdirSync(path.dirname(reqPath), { recursive: true });
  fs.writeFileSync(reqPath, JSON.stringify({ query, pars }, null, 2));
  const result = spawnSync(
    process.execPath,
    ["bin/ap-auth-post.mjs", reqPath, "--stage", stage],
    { cwd: frontRoot, env: process.env, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `ap-auth-post failed (${result.status}): ${result.stderr || result.stdout}`
    );
  }
  const parsed = parseApPostBody(result.stdout);
  if (!parsed) {
    throw new Error("ap-auth-post response missing body");
  }
  if (parsed.statusCode && parsed.statusCode !== 200) {
    throw new Error(`auth query ${query} failed: ${JSON.stringify(parsed)}`);
  }
  if (parsed.body) {
    return typeof parsed.body === "string" ? JSON.parse(parsed.body) : parsed.body;
  }
  return parsed;
}

async function openGetGame(api, metaGame, gameId, cbit) {
  const res = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "get_game",
      pars: { metaGame, id: gameId, cbit },
    }),
  });
  if (!res.ok) {
    throw new Error(`get_game HTTP ${res.status}`);
  }
  return res.json();
}

async function openPublicExploration(api, gameId) {
  const url = new URL(api);
  url.searchParams.set("query", "get_public_exploration");
  url.searchParams.set("game", gameId);
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function stackMoveCount(game) {
  try {
    const state = JSON.parse(game.state);
    return state.stack?.length ?? 0;
  } catch {
    return 0;
  }
}

async function main() {
  loadEnvLocal();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.slug || !opts.gameId || !opts.metaGame || !opts.viewAs) {
    console.error(
      "Usage: node bin/capture-gamemove-replay.mjs --slug <slug> --game-id <id> --meta-game <game> --view-as <playerUuid> [--cbits 0] [--stage prod] [--out path]"
    );
    process.exit(1);
  }

  const api = OPEN_API[opts.stage] ?? OPEN_API.prod;
  const getGamePayload = await openGetGame(
    api,
    opts.metaGame,
    opts.gameId,
    opts.cbits
  );
  const game = getGamePayload.game;
  if (!game?.state) {
    throw new Error("get_game missing game.state");
  }

  const moveNum = stackMoveCount(game);
  const explorationRows = authPost(
    "get_exploration",
    { game: opts.gameId, move: moveNum },
    opts.stage
  );

  let privateExploration = [];
  if (opts.includePrivate) {
    try {
      privateExploration = authPost(
        "get_private_exploration",
        { id: opts.gameId },
        opts.stage
      );
    } catch (err) {
      console.warn("get_private_exploration skipped:", err.message);
    }
  }

  const publicExploration = await openPublicExploration(api, opts.gameId);

  const bundle = {
    format: "abstractplay-gamemove-replay",
    version: 1,
    capturedAt: new Date().toISOString(),
    route: {
      metaGame: opts.metaGame,
      cbits: opts.cbits,
      gameID: opts.gameId,
    },
    viewAs: {
      playerId: opts.viewAs,
      settings: { all: { exploration: 1 } },
    },
    game,
    watchCount: getGamePayload.watchCount ?? 0,
    comments: getGamePayload.comments ?? [],
    explorationRows: Array.isArray(explorationRows) ? explorationRows : [],
    privateExploration: Array.isArray(privateExploration)
      ? privateExploration
      : [],
    publicExploration,
  };

  const defaultOut = path.join(
    frontRoot,
    "src/lib/GameMove/fixtures/replays",
    `${opts.slug}.json`
  );
  const outPath = opts.out ? path.resolve(opts.out) : defaultOut;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(
    `Open: /move/${opts.metaGame}/${opts.cbits}/${opts.gameId}?replay=${opts.slug}&layout=strip`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
