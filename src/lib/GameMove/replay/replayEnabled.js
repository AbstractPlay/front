import { REAL_MODE } from "../../realMode.js";

/** True only during `npm start` (Vite dev + local config). */
export function isGameMoveReplayEnabled() {
  return import.meta.env.DEV && REAL_MODE === "local";
}
