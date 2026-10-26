import { useCallback } from "react";
import { callAuthApi } from "../lib/api";
import { validateChallengeResponseArgs } from "../lib/challengeResponseArgs";

export function useChallengeResponse({ onError, onSuccess } = {}) {
  return useCallback(
    async (challenge, resp, comment) => {
      try {
        const { id, metaGame, standing } = validateChallengeResponseArgs(
          challenge,
          resp
        );
        const query =
          challenge.ladderId !== undefined && challenge.ladderId !== ""
            ? "respond_ladder_challenge"
            : "challenge_response";
        const pars = {
          id,
          metaGame,
          response: resp,
          comment: comment,
        };
        if (query === "challenge_response") {
          pars.standing = standing;
        }
        const res = await callAuthApi(query, pars);
        if (!res) {
          return;
        }
        const result = await res.json();
        if (result.statusCode !== 200) {
          console.log("handleChallengeResponse", result.statusCode);
          if (onError) {
            onError(JSON.parse(result.body));
          }
        } else if (onSuccess) {
          onSuccess(challenge);
        }
      } catch (error) {
        console.log("handleChallengeResponse catch", error);
        if (onError) {
          onError(error);
        }
      }
    },
    [onError, onSuccess]
  );
}
