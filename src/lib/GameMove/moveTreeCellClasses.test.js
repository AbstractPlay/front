import { expect } from "chai";
import {
  buildMoveCellClass,
  isExplorationPath,
  pathHasExplorationMoves,
} from "./moveTreeCellClasses";

describe("moveTreeCellClasses", () => {
  describe("isExplorationPath", () => {
    it("is false for mainline focus paths", () => {
      expect(isExplorationPath({ moveNumber: 3, exPath: [] })).to.be.false;
      expect(isExplorationPath({ moveNumber: 0 })).to.be.false;
    });

    it("is true when exPath has entries", () => {
      expect(isExplorationPath({ moveNumber: 2, exPath: [0] })).to.be.true;
    });
  });

  describe("buildMoveCellClass", () => {
    it("tags mainline spine moves", () => {
      const cls = buildMoveCellClass({
        movePath: { moveNumber: 1, exPath: [] },
      });
      expect(cls).to.include("mainlineMove");
      expect(cls).not.to.include("explorationMove");
    });

    it("tags exploration branches", () => {
      const cls = buildMoveCellClass({
        movePath: { moveNumber: 4, exPath: [1, 0] },
        isFocus: true,
      });
      expect(cls).to.include("explorationMove");
      expect(cls).to.include("gameMoveFocus");
      expect(cls).not.to.include("mainlineMove");
    });

    it("combines actual move and branch point markers on mainline", () => {
      const cls = buildMoveCellClass({
        movePath: { moveNumber: 5, exPath: [] },
        isActual: true,
        isBranchPoint: true,
      });
      expect(cls).to.include("actualMove");
      expect(cls).to.include("branchPoint");
      expect(cls).to.include("lastMove");
    });
  });

  describe("pathHasExplorationMoves", () => {
    it("detects exploration in variation rows", () => {
      const path = [
        [{ path: { moveNumber: 1, exPath: [] } }],
        [
          { path: { moveNumber: 2, exPath: [] } },
          { path: { moveNumber: 2, exPath: [0] } },
        ],
      ];
      expect(pathHasExplorationMoves(path)).to.be.true;
    });

    it("is false for mainline-only paths", () => {
      const path = [[{ path: { moveNumber: 1, exPath: [] } }]];
      expect(pathHasExplorationMoves(path)).to.be.false;
    });
  });
});
