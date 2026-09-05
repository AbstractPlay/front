import {
  resolveCustomizationScope,
  resolvePreferredColour,
} from "./resolveEffectiveCustomization.js";

const PALETTE_SIZE = 12;

export function padPalette(palette) {
  const padded = [...palette];
  while (padded.length < PALETTE_SIZE) {
    padded.push(null);
  }
  return padded;
}

export function mergeGameinfoDefaults(effective, customizationHints = []) {
  const result = [...effective];
  for (const hint of customizationHints) {
    const idx = hint.num - 1;
    if (
      idx >= 0 &&
      idx < result.length &&
      result[idx] == null &&
      hint.default != null
    ) {
      result[idx] = hint.default;
    }
  }
  return result;
}

export function extractSlot(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "object" && value.palette != null) {
    return value.palette;
  }
  return null;
}

export function coloursEqual(a, b) {
  if (a == null || b == null) {
    return a === b;
  }
  if (typeof a === "string" && typeof b === "string") {
    if (a.startsWith("#") && b.startsWith("#")) {
      return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
  }
  return a === b;
}

export function getPlayerSlots({ engine, numPlayers, customizationHints = [] }) {
  const slots = new Set();

  for (const hint of customizationHints) {
    if (hint.player != null) {
      slots.add(hint.num);
    }
  }

  if (engine != null && typeof engine.getPlayerColour === "function") {
    const n = numPlayers ?? 0;
    for (let p = 1; p <= n; p++) {
      const slot = extractSlot(engine.getPlayerColour(p));
      if (slot != null) {
        slots.add(slot);
      }
    }
  }

  if (slots.size === 0 && numPlayers > 0) {
    for (let p = 1; p <= numPlayers; p++) {
      slots.add(p);
    }
  }

  return [...slots].sort((a, b) => a - b);
}

/**
 * Renderer palette slot for the viewer's seat (engine primary; hints + seat fallback).
 */
export function resolveMySlot({
  engine,
  isParticipant,
  customizationHints = [],
}) {
  if (isParticipant < 0) {
    return null;
  }
  const playerNumber = isParticipant + 1;
  if (engine != null && typeof engine.getPlayerColour === "function") {
    return extractSlot(engine.getPlayerColour(playerNumber));
  }
  for (const hint of customizationHints) {
    if (hint.player === playerNumber && hint.num != null) {
      return hint.num;
    }
  }
  return playerNumber;
}

export function applyPreferredColourSwap(
  effective,
  { mySlot, playerSlots, preferred }
) {
  const myIdx = mySlot - 1;
  const collisionSlot = playerSlots
    .filter((s) => s !== mySlot)
    .find((s) => coloursEqual(effective[s - 1], preferred));

  if (collisionSlot != null) {
    const displaced = effective[myIdx];
    effective[myIdx] = preferred;
    effective[collisionSlot - 1] = displaced;
  } else {
    effective[myIdx] = preferred;
  }
  return effective;
}

export function resolveEffectivePalette({
  globalMe,
  metaGame,
  isParticipant,
  engine,
  numPlayers,
  customizationHints = [],
}) {
  const scope = resolveCustomizationScope(globalMe, metaGame);
  if (!scope.palette || scope.palette.length === 0) {
    return null;
  }

  let effective = padPalette(scope.palette);
  effective = mergeGameinfoDefaults(effective, customizationHints);

  const preferredColour = resolvePreferredColour(globalMe, metaGame);
  if (!preferredColour || isParticipant < 0) {
    return effective;
  }

  const playerSlots = getPlayerSlots({
    engine,
    numPlayers,
    customizationHints,
  });

  const mySlot = resolveMySlot({
    engine,
    isParticipant,
    customizationHints,
  });

  if (mySlot == null) {
    return effective;
  }

  return applyPreferredColourSwap([...effective], {
    mySlot,
    playerSlots,
    preferred: preferredColour,
  });
}
