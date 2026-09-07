const GRID_SIZE = 5;
const MIRROR_COLS = 3;

/** 32-bit string hash — stable across sessions for the same user id. */
export function hashUserSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function identiconHue(seed) {
  return hashUserSeed(seed) % 360;
}

/** 5×5 grid with vertical symmetry (GitHub-style identicon). */
export function identiconGrid(seed) {
  const hash = hashUserSeed(seed);
  const grid = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const rowCells = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const mirrorCol = col < MIRROR_COLS ? col : GRID_SIZE - 1 - col;
      const bitIndex = row * MIRROR_COLS + mirrorCol;
      rowCells.push(((hash >> bitIndex) & 1) === 1);
    }
    grid.push(rowCells);
  }

  const hasAny = grid.some((row) => row.some(Boolean));
  if (!hasAny) {
    grid[2][1] = true;
    grid[2][2] = true;
    grid[2][3] = true;
  }

  return grid;
}
