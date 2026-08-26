/** Exploration mark/delete/premove/reset tools (strip dock + queue card). */
function ExplorationToolbar({
  t,
  game,
  focus,
  exploration,
  gameOverNonLeafNode,
  handlers,
  className = "game-move-dock-entry__explore-tools submitOrMark",
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
          <div
            className="winningColorButton tooltipped"
            onClick={() => handleMark(0)}
          >
            {game.colors[0].isImage ? (
              <img
                className="winnerButtonImage"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(
                  game.colors[0].value
                )}`}
                alt=""
              />
            ) : (
              <span className="game-move-dock-entry__mark">1</span>
            )}
            <span className="tooltiptext">{t("Winning")}</span>
          </div>
          <div
            className="winningColorButton tooltipped"
            onClick={() => handleMark(1)}
          >
            {game.colors[1].isImage ? (
              <img
                className="winnerButtonImage"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(
                  game.colors[1].value
                )}`}
                alt=""
              />
            ) : (
              <span className="game-move-dock-entry__mark">2</span>
            )}
            <span className="tooltiptext">{t("Winning")}</span>
          </div>
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
