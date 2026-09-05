import { describe, expect, it } from "vitest";
import {
  applyPreferredColourSwap,
  coloursEqual,
  extractSlot,
  getPlayerSlots,
  resolveMySlot,
  mergeGameinfoDefaults,
  padPalette,
  resolveEffectivePalette,
} from "./resolveEffectivePalette.js";
import {
  resolveCustomizationScope,
  resolvePreferredColour,
} from "./resolveEffectiveCustomization.js";

const RED = "#e31a1c";
const BLUE = "#1f78b4";
const GREEN = "#33a02c";
const PURPLE = "#9b59b6";
const WHITE = "#ffffff";
const BLACK = "#000000";

const BIDE_PALETTE = [RED, BLUE, GREEN];

function globalMeWith(partial) {
  return { customizations: partial };
}

describe("resolveEffectiveCustomization", () => {
  it("resolves per-game palette over _default", () => {
    const scope = resolveCustomizationScope(
      globalMeWith({
        _default: { palette: [RED, BLUE] },
        bide: { palette: [GREEN, PURPLE] },
      }),
      "bide"
    );
    expect(scope.palette).toEqual([GREEN, PURPLE]);
    expect(scope.coloursGlobal).toBe(false);
    expect(scope.contextGlobal).toBe(false);
  });

  it("falls back to _default when no per-game customization", () => {
    const scope = resolveCustomizationScope(
      globalMeWith({
        _default: { palette: [RED, BLUE] },
      }),
      "bide"
    );
    expect(scope.palette).toEqual([RED, BLUE]);
    expect(scope.coloursGlobal).toBe(true);
    expect(scope.contextGlobal).toBe(true);
  });

  it("resolvePreferredColour inherits _default when per-game unset", () => {
    expect(
      resolvePreferredColour(
        globalMeWith({
          _default: { preferredColour: RED },
          bide: { palette: BIDE_PALETTE },
        }),
        "bide"
      )
    ).toBe(RED);
  });

  it("resolvePreferredColour uses per-game override", () => {
    expect(
      resolvePreferredColour(
        globalMeWith({
          _default: { preferredColour: RED },
          bide: { preferredColour: PURPLE },
        }),
        "bide"
      )
    ).toBe(PURPLE);
  });
});

describe("resolveEffectivePalette helpers", () => {
  it("padPalette extends to 12 slots", () => {
    expect(padPalette([RED, BLUE])).toHaveLength(12);
    expect(padPalette([RED, BLUE])[2]).toBeNull();
  });

  it("mergeGameinfoDefaults fills null slots from hints", () => {
    const hints = [
      { num: 1, default: RED },
      { num: 3, default: GREEN },
    ];
    const merged = mergeGameinfoDefaults([null, BLUE, null], hints);
    expect(merged[0]).toBe(RED);
    expect(merged[1]).toBe(BLUE);
    expect(merged[2]).toBe(GREEN);
  });

  it("extractSlot normalizes getPlayerColour return shapes", () => {
    expect(extractSlot(4)).toBe(4);
    expect(extractSlot({ palette: 5 })).toBe(5);
    expect(extractSlot(null)).toBeNull();
  });

  it("coloursEqual normalizes hex case", () => {
    expect(coloursEqual("#FF0000", "#ff0000")).toBe(true);
    expect(coloursEqual("red", "red")).toBe(true);
    expect(coloursEqual(RED, BLUE)).toBe(false);
  });

  it("getPlayerSlots unions hints and engine slots", () => {
    const engine = {
      getPlayerColour: (p) => (p === 1 ? 4 : 5),
    };
    const hints = [
      { num: 4, player: 1 },
      { num: 5, player: 2 },
    ];
    expect(getPlayerSlots({ engine, numPlayers: 2, customizationHints: hints })).toEqual([
      4, 5,
    ]);
  });

  it("getPlayerSlots falls back to seat numbers", () => {
    expect(getPlayerSlots({ numPlayers: 3 })).toEqual([1, 2, 3]);
  });

  it("resolveMySlot uses player hints when no engine", () => {
    const hints = [
      { num: 4, player: 1 },
      { num: 5, player: 2 },
    ];
    expect(
      resolveMySlot({ isParticipant: 1, customizationHints: hints })
    ).toBe(5);
    expect(
      resolveMySlot({ isParticipant: 0, customizationHints: hints })
    ).toBe(4);
  });

  it("resolveMySlot falls back to seat number without hints", () => {
    expect(resolveMySlot({ isParticipant: 1 })).toBe(2);
  });
});

describe("resolveEffectivePalette", () => {
  const bideGlobalMe = (preferredColour, palette = BIDE_PALETTE) =>
    globalMeWith({
      _default: { palette, preferredColour },
    });

  it("1: Bide 3P P2 preferred red swaps with P1", () => {
    const result = resolveEffectivePalette({
      globalMe: bideGlobalMe(RED),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual([BLUE, RED, GREEN]);
  });

  it("2: Bide 3P P2 prefers purple with no collision", () => {
    const result = resolveEffectivePalette({
      globalMe: bideGlobalMe(PURPLE),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual([RED, PURPLE, GREEN]);
  });

  it("3: Bloqueo swaps player slots only; pawns unchanged", () => {
    const pawn1 = "#aaaaaa";
    const pawn2 = "#bbbbbb";
    const pawn3 = "#cccccc";
    const bloqueoHints = [
      { num: 1, default: pawn1 },
      { num: 2, default: pawn2 },
      { num: 3, default: pawn3 },
      { num: 4, player: 1, default: WHITE },
      { num: 5, player: 2, default: BLACK },
    ];
    const engine = {
      getPlayerColour: (p) => (p === 1 ? 4 : 5),
    };
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        bloqueo: {
          palette: [pawn1, pawn2, pawn3, WHITE, BLACK],
          preferredColour: WHITE,
        },
      }),
      metaGame: "bloqueo",
      isParticipant: 1,
      engine,
      numPlayers: 2,
      customizationHints: bloqueoHints,
    });
    expect(result.slice(0, 3)).toEqual([pawn1, pawn2, pawn3]);
    expect(result[3]).toBe(BLACK);
    expect(result[4]).toBe(WHITE);
  });

  it("4: WaldMeister P2 prefers red; only player slot 2 changes", () => {
    const tree1 = "#228822";
    const tree2 = "#44aa44";
    const tree3 = "#66cc66";
    const waldHints = [
      { num: 1, player: 1 },
      { num: 2, player: 2 },
      { num: 3, default: tree1 },
      { num: 4, default: tree2 },
      { num: 5, default: tree3 },
    ];
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        waldmeister: {
          palette: [BLUE, GREEN, tree1, tree2, tree3],
          preferredColour: RED,
        },
      }),
      metaGame: "waldmeister",
      isParticipant: 1,
      numPlayers: 2,
      customizationHints: waldHints,
    });
    expect(result.slice(0, 5)).toEqual([BLUE, RED, tree1, tree2, tree3]);
  });

  it("5: no preferredColour leaves palette unchanged", () => {
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        _default: { palette: BIDE_PALETTE },
      }),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual(BIDE_PALETTE);
  });

  it("6: _default preferredColour applies without per-game customization", () => {
    const result = resolveEffectivePalette({
      globalMe: bideGlobalMe(RED),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual([BLUE, RED, GREEN]);
  });

  it("7: per-game preferredColour overrides _default", () => {
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        _default: { palette: BIDE_PALETTE, preferredColour: RED },
        bide: { palette: BIDE_PALETTE, preferredColour: PURPLE },
      }),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual([RED, PURPLE, GREEN]);
  });

  it("8: per-game palette with inherited _default preferredColour", () => {
    const gamePalette = [GREEN, BLUE, RED];
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        _default: { preferredColour: GREEN },
        bide: { palette: gamePalette },
      }),
      metaGame: "bide",
      isParticipant: 1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual([BLUE, GREEN, RED]);
  });

  it("9: mergeGameinfoDefaults fills null slots via full pipeline", () => {
    const hints = [
      { num: 1, default: RED },
      { num: 2, default: BLUE },
      { num: 3, default: GREEN },
    ];
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        _default: { palette: [null, null, null] },
      }),
      metaGame: "bide",
      isParticipant: -1,
      numPlayers: 3,
      customizationHints: hints,
    });
    expect(result.slice(0, 3)).toEqual(BIDE_PALETTE);
  });

  it("10: spectator does not apply preferred colour swap", () => {
    const result = resolveEffectivePalette({
      globalMe: bideGlobalMe(RED),
      metaGame: "bide",
      isParticipant: -1,
      numPlayers: 3,
    });
    expect(result.slice(0, 3)).toEqual(BIDE_PALETTE);
  });

  it("applyPreferredColourSwap swaps on collision among player slots", () => {
    const effective = [RED, BLUE, GREEN];
    applyPreferredColourSwap(effective, {
      mySlot: 2,
      playerSlots: [1, 2, 3],
      preferred: RED,
    });
    expect(effective).toEqual([BLUE, RED, GREEN]);
  });

  it("11: Bloqueo P2 preferred white without engine uses hint mySlot", () => {
    const pawn1 = "#aaaaaa";
    const pawn2 = "#bbbbbb";
    const pawn3 = "#cccccc";
    const bloqueoHints = [
      { num: 1, default: pawn1 },
      { num: 2, default: pawn2 },
      { num: 3, default: pawn3 },
      { num: 4, player: 1, default: WHITE },
      { num: 5, player: 2, default: BLACK },
    ];
    const result = resolveEffectivePalette({
      globalMe: globalMeWith({
        bloqueo: {
          palette: [pawn1, pawn2, pawn3, WHITE, BLACK],
          preferredColour: WHITE,
        },
      }),
      metaGame: "bloqueo",
      isParticipant: 1,
      numPlayers: 2,
      customizationHints: bloqueoHints,
    });
    expect(result.slice(0, 3)).toEqual([pawn1, pawn2, pawn3]);
    expect(result[3]).toBe(BLACK);
    expect(result[4]).toBe(WHITE);
  });
});
