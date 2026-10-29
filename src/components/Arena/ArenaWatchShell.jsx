import GameMoveShell from "../GameMoveShell";
import { ARENA_WATCH_BASE } from "../../lib/arena/arenaMoveBase";

/** Spectate arena games at `/arena/watch/:metaGame/:gameID`. */
export default function ArenaWatchShell() {
  return <GameMoveShell moveBasePath={ARENA_WATCH_BASE} arenaLiveClock />;
}
