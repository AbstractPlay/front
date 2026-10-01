import { expect } from "chai";
import {
  collectVariationChoices,
  explorationPathEquals,
  focusedMovePathIndex,
} from "./moveTreeVariations";

describe("moveTreeVariations", () => {
  describe("explorationPathEquals", () => {
    it("matches moveNumber and exPath", () => {
      expect(
        explorationPathEquals(
          { moveNumber: 2, exPath: [0, 1] },
          { moveNumber: 2, exPath: [0, 1] }
        )
      ).to.be.true;
      expect(
        explorationPathEquals(
          { moveNumber: 2, exPath: [0] },
          { moveNumber: 2, exPath: [1] }
        )
      ).to.be.false;
    });
  });

  describe("focusedMovePathIndex", () => {
    it("maps mainline and exploration depth to path indices", () => {
      expect(focusedMovePathIndex({ moveNumber: 3, exPath: [] })).to.equal(2);
      expect(focusedMovePathIndex({ moveNumber: 5, exPath: [0, 1] })).to.equal(
        6
      );
    });
  });

  describe("collectVariationChoices", () => {
    it("lists sibling exploration lines at the tip", () => {
      const exploration = [
        { move: "" },
        { move: "e4" },
        {
          move: "e5",
          children: [{ move: "Nf3" }, { move: "Nc3" }],
        },
      ];
      const focus = { moveNumber: 2, exPath: [1] };
      const { count, choices } = collectVariationChoices(focus, exploration, {
        gameOver: false,
      });
      expect(count).to.equal(2);
      expect(choices).to.deep.equal([
        { moveNumber: 2, exPath: [0] },
        { moveNumber: 2, exPath: [1] },
      ]);
    });
  });
});
