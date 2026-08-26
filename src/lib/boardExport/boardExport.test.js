import { describe, expect, it, vi } from "vitest";
import {
  getPathToFocus,
  slicePathFrames,
  labelPathFrame,
  buildPathFrameOptions,
  MAX_GIF_FRAMES,
} from "./enumeratePathFrames";

vi.mock("../Lab/exploration", () => ({
  sanitizeFocus: (_nodes, focus) => ({
    moveNumber: focus.moveNumber ?? 0,
    exPath: [...(focus.exPath ?? [])],
  }),
}));

function makeExploration(moves) {
  const nodes = [{ move: "", state: "{}" }];
  for (const move of moves) {
    nodes.push({ move, state: "{}", children: [] });
  }
  return nodes;
}

describe("enumeratePathFrames", () => {
  const game = { metaGame: "chess", state: "{}" };
  const t = (key, opts) => {
    if (key === "boardExport.pathInitial") return "Initial";
    if (key === "boardExport.pathMove") {
      return `Move ${opts.number}: ${opts.move}`;
    }
    if (key === "boardExport.pathVariation") {
      return `Variation: ${opts.move}`;
    }
    return key;
  };

  it("builds main-line path frames", () => {
    const exploration = makeExploration(["e4", "e5"]);
    const frames = getPathToFocus(exploration, game, {
      moveNumber: 2,
      exPath: [],
    });
    expect(frames).toEqual([
      { moveNumber: 0, exPath: [] },
      { moveNumber: 1, exPath: [] },
      { moveNumber: 2, exPath: [] },
    ]);
  });

  it("appends variation steps after main-line tip", () => {
    const exploration = makeExploration(["e4", "e5"]);
    exploration[2].children = [
      { move: "Nf3", state: "{}", children: [] },
      { move: "Nc3", state: "{}", children: [] },
    ];
    exploration[2].children[0].children = [
      { move: "Nc6", state: "{}", children: [] },
    ];

    const frames = getPathToFocus(exploration, game, {
      moveNumber: 2,
      exPath: [0, 0],
    });

    expect(frames).toEqual([
      { moveNumber: 0, exPath: [] },
      { moveNumber: 1, exPath: [] },
      { moveNumber: 2, exPath: [] },
      { moveNumber: 2, exPath: [0] },
      { moveNumber: 2, exPath: [0, 0] },
    ]);
  });

  it("slices path frames within bounds", () => {
    const exploration = makeExploration(["e4", "e5", "Nf3"]);
    const path = getPathToFocus(exploration, game, {
      moveNumber: 3,
      exPath: [],
    });
    expect(slicePathFrames(path, 1, 2)).toEqual([
      { moveNumber: 1, exPath: [] },
      { moveNumber: 2, exPath: [] },
    ]);
    expect(slicePathFrames(path, -5, 99)).toEqual(path);
  });

  it("labels initial and move frames", () => {
    const exploration = makeExploration(["e4"]);
    const getFocusNode = vi.fn((_exp, _game, focus) => ({
      move: focus.exPath.length ? "Nf3" : exploration[focus.moveNumber]?.move,
    }));

    expect(
      labelPathFrame(
        { moveNumber: 0, exPath: [] },
        exploration,
        getFocusNode,
        game,
        t
      )
    ).toBe("Initial");
    expect(
      labelPathFrame(
        { moveNumber: 1, exPath: [] },
        exploration,
        getFocusNode,
        game,
        t
      )
    ).toBe("Move 1: e4");
    expect(
      labelPathFrame(
        { moveNumber: 1, exPath: [0] },
        exploration,
        getFocusNode,
        game,
        t
      )
    ).toBe("Variation: Nf3");
  });

  it("builds path frame options with labels", () => {
    const exploration = makeExploration(["e4"]);
    const frames = getPathToFocus(exploration, game, {
      moveNumber: 1,
      exPath: [],
    });
    const options = buildPathFrameOptions(
      frames,
      exploration,
      () => ({ move: "e4" }),
      game,
      t
    );
    expect(options).toHaveLength(2);
    expect(options[0].label).toBe("Initial");
    expect(options[1].label).toBe("Move 1: e4");
  });

  it("exposes a generous frame cap constant", () => {
    expect(MAX_GIF_FRAMES).toBeGreaterThanOrEqual(100);
  });
});
