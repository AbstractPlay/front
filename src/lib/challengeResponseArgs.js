/**
 * @param {unknown} challenge
 * @param {unknown} resp
 * @returns {{ id: string, metaGame: string, standing: boolean }}
 */
export function validateChallengeResponseArgs(challenge, resp) {
  if (challenge == null || typeof challenge !== "object" || Array.isArray(challenge)) {
    const kind =
      challenge === null || challenge === undefined
        ? String(challenge)
        : Array.isArray(challenge)
          ? "array"
          : typeof challenge;
    throw new Error(
      `Challenge response needs a challenge object as the first argument (got ${kind}). ` +
        "Call respond(challenge, true|false, comment)."
    );
  }

  const id = challenge.id;
  const metaGame = challenge.metaGame;
  if (id == null || id === "") {
    throw new Error(
      "Challenge response needs challenge.id. Check that the modal passes the full challenge record."
    );
  }
  if (metaGame == null || metaGame === "") {
    throw new Error(
      "Challenge response needs challenge.metaGame. Check that the modal passes the full challenge record."
    );
  }

  if (resp !== true && resp !== false) {
    throw new Error(
      `Challenge response needs true (accept) or false (decline/leave) as the second argument (got ${String(resp)}).`
    );
  }

  return {
    id,
    metaGame,
    standing: challenge.standing === true,
  };
}
