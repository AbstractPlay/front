function isActiveGame(game) {
  if (Array.isArray(game.toMove)) {
    return (game.players?.length ?? 0) > 0;
  }
  return game.toMove !== "" && game.toMove !== null;
}

export function collectWatchGames(globalMe, pathname) {
  const keys = new Map();

  if (globalMe?.games) {
    for (const game of globalMe.games) {
      if (!isActiveGame(game)) {
        continue;
      }
      if (game.metaGame && game.id) {
        keys.set(`${game.metaGame}#${game.id}`, {
          meta: game.metaGame,
          id: game.id,
        });
      }
    }
  }

  const routeMatch = pathname.match(/^\/move\/([^/]+)\/[^/]+\/([^/]+)/);
  if (routeMatch) {
    const meta = routeMatch[1];
    const id = routeMatch[2];
    keys.set(`${meta}#${id}`, { meta, id });
  }

  if (globalMe?.watchedGames) {
    for (const game of globalMe.watchedGames) {
      if (game.metaGame && game.id) {
        keys.set(`${game.metaGame}#${game.id}`, {
          meta: game.metaGame,
          id: game.id,
        });
      }
    }
  }

  return [...keys.values()];
}

export function gamesWatchKey(games) {
  return JSON.stringify(games);
}

export function gameUpdateMatchesGame(payload, meta, id) {
  return payload?.meta === meta && payload?.id === id;
}
