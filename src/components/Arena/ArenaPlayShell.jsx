import GameMoveShell from "../GameMoveShell";
import { ARENA_MOVE_BASE } from "../../lib/arena/arenaMoveBase";

/** Live arena play at `/arena/play/:metaGame/:gameID` (Fischer clock, submit_arena_move). */
export default function ArenaPlayShell() {
  return (
    <GameMoveShell
      moveBasePath={ARENA_MOVE_BASE}
      submitMoveQuery="submit_arena_move"
      arenaLiveClock
    />
  );
}
