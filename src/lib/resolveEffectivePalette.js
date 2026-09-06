import {
  resolveCustomizationScope,
  resolvePreferredColour,
} from "./resolveEffectiveCustomization.js";

const PALETTE_SIZE = 12;

/** Matches @abstractplay/renderer paletteDefault (used when palette is empty). */
export const DEFAULT_RENDERER_PALETTE = [
  "#e31a1c",
  "#1f78b4",
  "#33a02c",
  "#ffff99",
  "#6a3d9a",
  "#ff7f00",
  "#b15928",
  "#fb9a99",
  "#a6cee3",
  "#b2df8a",
  "#fdbf6f",
  "#cab2d6",
];

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
  const preferredColour = resolvePreferredColour(globalMe, metaGame);

  let basePalette = scope.palette;
  if (!basePalette || basePalette.length === 0) {
    if (!preferredColour) {
      return null;
    }
    basePalette = [...DEFAULT_RENDERER_PALETTE];
  }

  let effective = padPalette(basePalette);
  effective = mergeGameinfoDefaults(effective, customizationHints);

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

/**
 * Palette for Customize live preview (local editor state, viewer as P1).
 */
export function resolveCustomizePreviewPalette({
  palette,
  preferredColour,
  metaGame,
  customizationHints = [],
}) {
  const hasPalette = palette && palette.length > 0;
  const hasPreferred =
    preferredColour != null && preferredColour !== "";
  if (!hasPalette && !hasPreferred) {
    return null;
  }

  let numPlayers = 0;
  for (const hint of customizationHints) {
    if (hint.player != null && hint.player > numPlayers) {
      numPlayers = hint.player;
    }
  }
  if (numPlayers === 0) {
    numPlayers = 2;
  }

  const customization = {};
  if (hasPalette) {
    customization.palette = palette;
  }
  if (hasPreferred) {
    customization.preferredColour = preferredColour;
  }

  return resolveEffectivePalette({
    globalMe: { customizations: { [metaGame]: customization } },
    metaGame,
    isParticipant: 0,
    numPlayers,
    customizationHints,
  });
}
