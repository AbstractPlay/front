// ARENA_UI_DISABLED — remove at arena launch (grep)

const raw = import.meta.env.VITE_ARENA_UI_DISABLED;

/** When true, hide all arena UI (prod build until S6 launch). */
export function arenaUiDisabled() {
  return raw === "true" || raw === "1";
}
