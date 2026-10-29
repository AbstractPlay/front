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
    const meta = decodeURIComponent(arenaPlayMatch[1]);
    const id = decodeURIComponent(arenaPlayMatch[2]);
    keys.set(`${meta}#${id}`, { meta, id });
  }

  const arenaWatchMatch = pathname.match(/^\/arena\/watch\/([^/]+)\/([^/]+)/);
  if (arenaWatchMatch) {
    const meta = decodeURIComponent(arenaWatchMatch[1]);
    const id = decodeURIComponent(arenaWatchMatch[2]);
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

/**
 * Merge dashboard-derived watch list with the current route (always at send time).
 * Avoids missing `game` WS events when React/Zustand lag behind navigation or a
 * tab still runs an older bundle that never registered arena routes in the hook.
 */
export function watchGamesForSend(
  desiredWatchGames,
  globalMe,
  pathname = "",
) {
  const keys = new Map();

  if (Array.isArray(desiredWatchGames)) {
    for (const g of desiredWatchGames) {
      if (g?.meta && g?.id) {
        keys.set(`${g.meta}#${g.id}`, { meta: g.meta, id: g.id });
      }
    }
  }

  for (const g of collectWatchGames(globalMe, pathname)) {
    keys.set(`${g.meta}#${g.id}`, g);
  }

  return [...keys.values()];
}

export function gameUpdateMatchesGame(payload, meta, id) {
  return payload?.meta === meta && payload?.id === id;
}
