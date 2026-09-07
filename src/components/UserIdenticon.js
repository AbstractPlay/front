import { identiconGrid, identiconHue } from "../lib/userIdenticon";

const VIEW_SIZE = 40;
const CELL_SIZE = VIEW_SIZE / 5;

function UserIdenticon({ userId, className = "" }) {
  if (!userId) {
    return null;
  }

  const hue = identiconHue(userId);
  const grid = identiconGrid(userId);
  const classNames = ["nav-avatar-identicon", className].filter(Boolean).join(" ");

  return (
    <svg
      className={classNames}
      style={{ "--identicon-hue": hue }}
      width={VIEW_SIZE}
      height={VIEW_SIZE}
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      aria-hidden="true"
    >
      <rect
        className="nav-avatar-identicon-bg"
        width={VIEW_SIZE}
        height={VIEW_SIZE}
      />
      {grid.flatMap((row, rowIndex) =>
        row.map((filled, colIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              className="nav-avatar-identicon-cell"
              x={colIndex * CELL_SIZE}
              y={rowIndex * CELL_SIZE}
              width={CELL_SIZE}
              height={CELL_SIZE}
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default UserIdenticon;
