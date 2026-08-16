/**
 * "You are player N" chip with the player's colour swatch (beta layouts).
 */
function ColourSwatch({ colour }) {
  if (!colour) return null;
  if (colour.isImage) {
    return (
      <img
        className="game-move-player-colour-chip__swatch toMoveImage"
        src={`data:image/svg+xml;utf8,${encodeURIComponent(colour.value)}`}
        alt=""
      />
    );
  }
  return (
    <span className="game-move-player-colour-chip__swatch" aria-hidden="true">
      {colour.value}
    </span>
  );
}

function PlayerColourChip({ colour, label, className = "" }) {
  if (!label) return null;
  return (
    <span
      className={`game-move-context-strip__chip game-move-player-colour-chip ${className}`.trim()}
    >
      <ColourSwatch colour={colour} />
      <span className="game-move-player-colour-chip__label">{label}</span>
    </span>
  );
}

export default PlayerColourChip;
