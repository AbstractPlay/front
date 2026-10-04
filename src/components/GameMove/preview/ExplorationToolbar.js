import {
  EXPLORATION_OUTCOME_DRAW,
  EXPLORATION_OUTCOME_UNDECIDED,
} from "../../../lib/GameMove/explorationOutcome.js";
import {
  ExplorationDrawMarkButton,
  ExplorationPlayerWinMarkButton,
  ExplorationUndecidedMarkButton,
} from "../ExplorationOutcomeIndicator.js";

/** Exploration mark/delete/premove/reset tools (strip dock + queue card). */
function ExplorationToolbar({
  t,
  game,
  focus,
  exploration,
  gameOverNonLeafNode,
  handlers,
  className = "game-move-dock-entry__explore-tools game-move-explore-mark-tools submitOrMark",
}) {
  const {
    handleMark,
    handleDeleteExploration,
    handlePremove,
    handleReset,
    getFocusNode,
  } = handlers;

  if (!focus.exPath.length && !game.canExplore) {
    return null;
  }

  return (
    <div className={className}>
      {focus.exPath.length > 0 &&
      game.canExplore &&
      game.colors?.length >= 2 ? (
        <>
          <ExplorationPlayerWinMarkButton
            game={game}
            playerIndex={0}
            t={t}
            onClick={() => handleMark(0)}
          />
          <ExplorationPlayerWinMarkButton
            game={game}
            playerIndex={1}
            t={t}
            onClick={() => handleMark(1)}
          />
          <ExplorationDrawMarkButton
            t={t}
            onClick={() => handleMark(EXPLORATION_OUTCOME_DRAW)}
          />
          <ExplorationUndecidedMarkButton
            t={t}
            onClick={() => handleMark(EXPLORATION_OUTCOME_UNDECIDED)}
          />
        </>
      ) : null}
      {focus.exPath.length > 0 && game.canExplore && !gameOverNonLeafNode ? (
        <div
          className="winningColorButton tooltipped"
          onClick={() => handleDeleteExploration()}
        >
          <i className="fa fa-trash resetExploreIcon" aria-hidden="true" />
          <span className="tooltiptext">{t("DeleteSubtree")}</span>
        </div>
      ) : null}
      {focus.exPath.length > 1 &&
      game.canExplore &&
      !game.gameOver &&
      !game.simultaneous &&
      getFocusNode(exploration, game, focus)?.toMove !== game.me ? (
        <div
          className="winningColorButton tooltipped"
          onClick={() => handlePremove()}
        >
          {getFocusNode(exploration, game, focus)?.premove ? (
            <span className="highlight">
              <i className="fa fa-clock-o premoveIcon" aria-hidden="true" />
            </span>
          ) : (
            <i className="fa fa-clock-o premoveIcon" aria-hidden="true" />
          )}
          <span className="tooltiptext">
            {getFocusNode(exploration, game, focus)?.premove
              ? t("ClearPremove")
              : t("MarkPremove")}
          </span>
        </div>
      ) : null}
      {focus.exPath.length > 0 ? (
        <div
          className="winningColorButton tooltipped"
          onClick={() => handleReset()}
        >
          <i className="fa fa-undo resetIcon" aria-hidden="true" />
          <span className="tooltiptext">{t("ResetExploration")}</span>
        </div>
      ) : null}
    </div>
  );
}

export default ExplorationToolbar;
