export function collectWatchGames(globalMe, pathname) {
  const keys = new Map();

  if (globalMe?.activeGames) {
    for (const game of globalMe.activeGames) {
      if (game.metaGame && game.id) {
        keys.set(`${game.metaGame}#${game.id}`, {
          meta: game.metaGame,
          id: game.id,
        });
      }
    }
  }

  const moveRouteMatch = pathname.match(/^\/move\/([^/]+)\/[^/]+\/([^/]+)/);
  if (moveRouteMatch) {
    const meta = moveRouteMatch[1];
    const id = moveRouteMatch[2];
    keys.set(`${meta}#${id}`, { meta, id });
  }

  const arenaPlayMatch = pathname.match(/^\/arena\/play\/([^/]+)\/([^/]+)/);
  if (arenaPlayMatch) {
    const meta = arenaPlayMatch[1];
    const id = arenaPlayMatch[2];
    keys.set(`${meta}#${id}`, { meta, id });
  }

  const arenaWatchMatch = pathname.match(/^\/arena\/watch\/([^/]+)\/([^/]+)/);
  if (arenaWatchMatch) {
    const meta = arenaWatchMatch[1];
    const id = arenaWatchMatch[2];
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
