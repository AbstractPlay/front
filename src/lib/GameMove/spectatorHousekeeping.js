import { callAuthApi, getAuthToken } from "../api";

/** Sync in-progress commented flag; skipped for anonymous spectators. */
export async function maybeSyncInProgressCommentedFlag({
  gameID,
  metaGame,
  game,
  hasInterestingComments,
}) {
  const token = await getAuthToken();
  if (!token) return;

  if (game.toMove === "") return;
  if (
    (game.commented ? 0 : game.commented) !==
    (hasInterestingComments ? 1 : 0)
  ) {
    await callAuthApi(
      "update_commented",
      {
        id: gameID,
        metaGame,
        cbit: 0,
        commented: hasInterestingComments ? 1 : 0,
      },
      false
    ).catch((err) => {
      console.log("Failed to update commented flag:", err);
    });
  }
}

/** Timeloss/abandoned checks require auth; anonymous viewers skip them. */
export async function runCheckTimeQuery({ query, gameId, metaGame }) {
  const token = await getAuthToken();
  if (!token) return null;

  return callAuthApi(query, {
    id: gameId,
    metaGame,
  });
}
