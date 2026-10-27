import { tournamentPlaySupported } from "./tournamentGame";

/** Ladders require the same 2-player rated meta support as tournaments. */
export function ladderPlaySupported(metaGame) {
  return tournamentPlaySupported(metaGame);
}
