export function boardExportBasename(metaGame, gameId) {
  const safeGame = (gameId ?? "board").toString().replace(/[^\w.-]+/g, "-");
  const safeMeta = (metaGame ?? "game").toString().replace(/[^\w.-]+/g, "-");
  return `${safeMeta}-${safeGame}`;
}

export function boardPngFilename(metaGame, gameId) {
  return `${boardExportBasename(metaGame, gameId)}.png`;
}

export function boardGifFilename(metaGame, gameId) {
  return `${boardExportBasename(metaGame, gameId)}.gif`;
}
