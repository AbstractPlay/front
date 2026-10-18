import { describe, it, expect } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import {
  buildStartPositionPayload,
  buildStartPositionFromLabSession,
  isStartPositionChallengeEligible,
} from "./challengeStartPosition";

describe("challengeStartPosition", () => {
  it("buildStartPositionPayload wraps state", () => {
    const state = '{"game":"saltire"}';
    expect(buildStartPositionPayload(state)).toEqual({
      startPosition: { state },
    });
  });

  it("isStartPositionChallengeEligible matches teaching rules for saltire 2P", () => {
    expect(isStartPositionChallengeEligible("saltire", 2, [])).toBe(true);
    expect(isStartPositionChallengeEligible("saltire", 3, [])).toBe(false);
  });

  it("buildStartPositionFromLabSession uses tip state at focus", () => {
    const engine = GameFactory("saltire", undefined, []);
    const opening = engine.serialize();
    engine.move(engine.moves()[0]);
    const after = engine.serialize();
    const game = { metaGame: "saltire", selectedVariants: [] };
    const nodes = [
      { state: opening, children: [{ move: "x", children: [] }] },
      { state: after, children: [] },
    ];
    const draft = buildStartPositionFromLabSession({
      game,
      nodes,
      focus: { moveNumber: 1, exPath: [] },
    });
    expect(draft.metaGame).toBe("saltire");
    expect(draft.state).toBe(after);
    expect(draft.playerCount).toBe(2);
  });
});
