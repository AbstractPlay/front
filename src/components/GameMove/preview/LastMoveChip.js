/** Last-move pill with monospace notation (shared across beta layouts). */
function LastMoveChip({
  t,
  lastMoveNotation,
  lastMovePlayerName,
  className = "",
}) {
  if (!lastMoveNotation) {
    return null;
  }

  const rootClass = ["game-move-last-move-chip", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass}>
      {lastMovePlayerName ? (
        <>
          <span className="game-move-last-move-chip__label">
            {t("gameMove.layout.lastMoveByPrefix", {
              player: lastMovePlayerName,
            })}
          </span>
          <code className="game-move-last-move-chip__notation">
            {lastMoveNotation}
          </code>
        </>
      ) : (
        <>
          <span className="game-move-last-move-chip__label">
            {t("gameMove.layout.lastMoveLabel")}
          </span>
          <code className="game-move-last-move-chip__notation">
            {lastMoveNotation}
          </code>
        </>
      )}
    </span>
  );
}

export default LastMoveChip;
