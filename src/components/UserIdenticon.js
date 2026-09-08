import { identiconGrid, identiconHue } from "../lib/userIdenticon";

const DEFAULT_SIZE = 40;

function UserIdenticon({ userId, className = "", size = DEFAULT_SIZE }) {
  if (!userId) {
    return null;
  }

  const hue = identiconHue(userId);
  const grid = identiconGrid(userId);
  const cellSize = size / 5;
  const classNames = ["nav-avatar-identicon", className].filter(Boolean).join(" ");

  return (
    <svg
      className={classNames}
      style={{ "--identicon-hue": hue }}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <rect
        className="nav-avatar-identicon-bg"
        width={size}
        height={size}
      />
      {grid.flatMap((row, rowIndex) =>
        row.map((filled, colIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              className="nav-avatar-identicon-cell"
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default UserIdenticon;
