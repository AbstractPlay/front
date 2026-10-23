/** @see node-backend lib/tournaments/completedTournamentLookup.ts */
export function isConcreteMetaGame(metaGame) {
  return (
    metaGame !== undefined &&
    metaGame !== null &&
    metaGame !== "" &&
    metaGame !== "undefined"
  );
}

/**
 * Ongoing / registration tournaments (still on `TOURNAMENT`). Id-only `get_tournament` is enough.
 */
export function tournamentDetailPathActive(tournamentId) {
  return `/tournament/${tournamentId}`;
}

/**
 * Ended or archived tournaments. Path includes metaGame so API can use one `COMPLETEDTOURNAMENT` Get.
 */
export function tournamentDetailPathArchived(tournamentId, metaGame) {
  if (!isConcreteMetaGame(metaGame)) {
    return tournamentDetailPathActive(tournamentId);
  }
  return `/tournament/${metaGame}/${tournamentId}`;
}

/** `metaGame#tournamentId` or plain id from game rows. */
export function tournamentDetailPathFromGameRef(tournamentRef, gameMetaGame, gameId) {
  if (tournamentRef === undefined || tournamentRef === null || tournamentRef === "") {
    return null;
  }
  const ref = String(tournamentRef);
  if (ref.includes("#")) {
    const [meta, id] = ref.split("#");
    if (id) {
      return tournamentDetailPathArchived(id, meta);
    }
  }
  if (isConcreteMetaGame(gameMetaGame) && gameId) {
    return `${tournamentDetailPathActive(ref)}?gameId=${gameId}&metaGame=${gameMetaGame}`;
  }
  return tournamentDetailPathActive(ref);
}
