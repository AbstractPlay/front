import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Live game 94effd59-68fc-4b34-9547-8f0a97ff6a06 — sacrifice g2 Eyuf (complete:-1).
 * State captured from production get_game for the reported bug.
 */
export const HOMEWORLDS_SACRIFICE_STATE = readFileSync(
  path.join(__dirname, "homeworlds-state.json"),
  "utf8"
);

export const homeworldsContracts = [
  {
    id: "homeworlds-sacrifice-declaration",
    metaGame: "homeworlds",
    state: HOMEWORLDS_SACRIFICE_STATE,
    move: "sacrifice g2 Eyuf",
    whileEditing: { partial: true, persistable: false },
    afterComplete: { partial: true, persistable: false },
    submitAfterComplete: false,
  },
  {
    id: "homeworlds-sacrifice-autofill-build",
    metaGame: "homeworlds",
    state: HOMEWORLDS_SACRIFICE_STATE,
    move: "sacrifice g2 Eyuf, build",
    whileEditing: { partial: true, persistable: false },
    afterComplete: { partial: true, persistable: false },
    submitAfterComplete: false,
  },
];
