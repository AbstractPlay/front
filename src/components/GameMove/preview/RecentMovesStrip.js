function getRecentMainlineMoves(exploration, limit = 12) {
  if (!Array.isArray(exploration)) return [];
  const items = [];
  for (let i = 1; i < exploration.length; i++) {
    const node = exploration[i];
    if (node?.move) {
      items.push({
        moveNumber: i,
        move: node.move,
        exPath: [],
      });
    }
  }
  return items.slice(-limit);
}

function isSameFocus(focus, item) {
  return (
    focus?.moveNumber === item.moveNumber &&
    (focus?.exPath?.length ?? 0) === 0 &&
    item.exPath.length === 0
  );
}

function RecentMovesStrip({ session, t }) {
  const { focus, explorationRef, handleGameMoveClick } = session;
  const exploration = explorationRef.current?.nodes;
  const recent = getRecentMainlineMoves(exploration);

  if (recent.length === 0 || !focus) {
    return null;
  }

  return (
    <section
      className="game-move-recent-moves"
      aria-labelledby="card-recent-moves"
    >
      <h2 id="card-recent-moves" className="game-move-queue-card__section-heading">
        {t("gameMove.layout.recentMoves")}
      </h2>
      <div
        className="game-move-recent-moves__strip"
        role="list"
        aria-label={t("gameMove.layout.recentMoves")}
      >
        {recent.map((item) => (
          <button
            key={`recent-${item.moveNumber}`}
            type="button"
            role="listitem"
            className={`game-move-recent-moves__chip${
              isSameFocus(focus, item) ? " is-active" : ""
            }`}
            onClick={() => handleGameMoveClick(item)}
          >
            <span className="game-move-recent-moves__num">{item.moveNumber}.</span>
            <span className="game-move-recent-moves__notation">{item.move}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default RecentMovesStrip;
