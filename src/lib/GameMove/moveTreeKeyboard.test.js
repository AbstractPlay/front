import { expect } from "chai";
import {
  handleMoveTreeKeyDown,
  shouldSkipMoveTreeKeyboard,
} from "./moveTreeKeyboard";

describe("moveTreeKeyboard", () => {
  describe("shouldSkipMoveTreeKeyboard", () => {
    it("skips when exploration is null", () => {
      expect(shouldSkipMoveTreeKeyboard({ id: "" }, null)).to.be.true;
    });

    it("skips known move-entry and comment inputs", () => {
      expect(
        shouldSkipMoveTreeKeyboard({ id: "enterAMove" }, [{ move: "e4" }])
      ).to.be.true;
      expect(
        shouldSkipMoveTreeKeyboard({ id: "card-enterAMove" }, [{ move: "e4" }])
      ).to.be.true;
    });

    it("does not skip when focus is elsewhere", () => {
      expect(shouldSkipMoveTreeKeyboard({ id: "theBoardSVG" }, [])).to.be.false;
    });
  });

  describe("handleMoveTreeKeyDown", () => {
    it("navigates home on Home key", () => {
      const clicks = [];
      const exploration = [{ move: "" }, { move: "e4" }, { move: "e5" }];
      const event = { key: "Home", preventDefault() {} };
      handleMoveTreeKeyDown(event, {
        focus: { moveNumber: 2, exPath: [] },
        exploration,
        game: { gameOver: false },
        handleGameMoveClick: (foc) => clicks.push(foc),
      });
      expect(clicks).to.deep.equal([{ moveNumber: 0, exPath: [] }]);
    });

    it("does nothing when typing in the move input", () => {
      const clicks = [];
      const exploration = [{ move: "" }, { move: "e4" }];
      const previousActive = document.activeElement;
      const input = document.createElement("input");
      input.id = "enterAMove";
      document.body.appendChild(input);
      input.focus();

      try {
        handleMoveTreeKeyDown(
          { key: "ArrowLeft", preventDefault() {} },
          {
            focus: { moveNumber: 1, exPath: [] },
            exploration,
            game: { gameOver: false },
            handleGameMoveClick: (foc) => clicks.push(foc),
          }
        );
        expect(clicks).to.deep.equal([]);
      } finally {
        input.remove();
        if (previousActive?.focus) {
          previousActive.focus();
        }
      }
    });
  });
});
