const LADDER_POINTS_FORMAT = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function roundLadderPoints(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(n * 100) / 100;
}

/** Display ladder points (and magnitudes such as decay loss) with at most two decimal places. */
export function formatLadderPoints(value) {
  return LADDER_POINTS_FORMAT.format(roundLadderPoints(value));
}

/** Signed ladder point change for notifications and similar copy. */
export function formatLadderPointsDelta(value) {
  const rounded = roundLadderPoints(value);
  if (rounded > 0) {
    return `+${LADDER_POINTS_FORMAT.format(rounded)}`;
  }
  if (rounded < 0) {
    return `-${LADDER_POINTS_FORMAT.format(Math.abs(rounded))}`;
  }
  return LADDER_POINTS_FORMAT.format(0);
}
