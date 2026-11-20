import GameMoveShell from "../GameMoveShell";
import { ARENA_WATCH_BASE } from "../../lib/arena/arenaMoveBase";
import ArenaRealtimeConnectionNotice from "./ArenaRealtimeConnectionNotice";
import "./arena.css";

/** Spectate arena games at `/arena/watch/:metaGame/:gameID`. */
export default function ArenaWatchShell() {
  return (
    <>
      <ArenaRealtimeConnectionNotice className="arena-realtime-connection--play" />
      <GameMoveShell moveBasePath={ARENA_WATCH_BASE} arenaLiveClock />
    </>
  );
}
