// LADDER_UI_DISABLED — remove at launch (grep)

/** Prod sets VITE_LADDER_UI_DISABLED=true until ladder launch; dev/staging omit it. */
export function ladderUiDisabled() {
  const v = import.meta.env.VITE_LADDER_UI_DISABLED;
  return v === "true" || v === "1";
}
