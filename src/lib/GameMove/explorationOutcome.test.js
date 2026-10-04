import { expect } from "chai";
import {
  EXPLORATION_OUTCOME_DRAW,
  EXPLORATION_OUTCOME_UNDECIDED,
  deriveParentExplorationOutcome,
  isPlayerWinExplorationOutcome,
  showsExplorationOutcomeMarker,
} from "./explorationOutcome.js";

describe("explorationOutcome", () => {
  it("treats draw as a visible marker outcome", () => {
    expect(showsExplorationOutcomeMarker(EXPLORATION_OUTCOME_DRAW)).to.be.true;
    expect(showsExplorationOutcomeMarker(EXPLORATION_OUTCOME_UNDECIDED)).to.be
      .false;
    expect(isPlayerWinExplorationOutcome(EXPLORATION_OUTCOME_DRAW)).to.be.false;
    expect(isPlayerWinExplorationOutcome(0)).to.be.true;
    expect(isPlayerWinExplorationOutcome(1)).to.be.true;
  });

  it("derives parent outcomes including draw propagation", () => {
    expect(deriveParentExplorationOutcome([EXPLORATION_OUTCOME_DRAW], 0)).to.equal(
      EXPLORATION_OUTCOME_DRAW
    );
    expect(
      deriveParentExplorationOutcome(
        [EXPLORATION_OUTCOME_DRAW, EXPLORATION_OUTCOME_DRAW],
        1
      )
    ).to.equal(EXPLORATION_OUTCOME_DRAW);
    expect(
      deriveParentExplorationOutcome([1, EXPLORATION_OUTCOME_DRAW], 0)
    ).to.equal(EXPLORATION_OUTCOME_DRAW);
    expect(deriveParentExplorationOutcome([0, EXPLORATION_OUTCOME_DRAW], 0)).to.equal(
      0
    );
    expect(deriveParentExplorationOutcome([1, 1], 0)).to.equal(1);
    expect(deriveParentExplorationOutcome([1, -1], 0)).to.equal(
      EXPLORATION_OUTCOME_UNDECIDED
    );
  });
});
