import { signInWithRedirect } from "aws-amplify/auth";
import { API_ENDPOINT_AUTH } from "../config";
import {
  getAuthTokenFromSession,
  refreshAuthSession,
} from "./authSession";
import { maybeReplayAuthResponse } from "./GameMove/replay/shimEntry.js";

// token is null if not logged in
export const getAuthToken = getAuthTokenFromSession;

async function postAuthQuery(query, pars, token) {
  return fetch(API_ENDPOINT_AUTH, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      pars,
    }),
  });
}

/** Best-effort auth POST during tab close (no redirect on 401). */
export function postAuthQueryKeepalive(query, pars, token) {
  if (!token) {
    return;
  }
  void postAuthQuery(query, pars, token).catch(() => {});
}

// Set requireAuth to false to you are calling this from a flow that is supported for non-logged in users
export const callAuthApi = async (query, pars, requireAuth = true) => {
  const replayResponse = maybeReplayAuthResponse(query, pars);
  if (replayResponse) {
    return replayResponse;
  }

  const token = await getAuthToken();
  if (token === null) {
    if (requireAuth) {
      await signInWithRedirect();
    }
    return;
  }

  let response = await postAuthQuery(query, pars, token);

  // Handle expired/invalid token from backend
  if (response.status === 401 || response.status === 403) {
    if (!requireAuth) {
      return response;
    }

    const refreshed = await refreshAuthSession();
    if (refreshed.status === "ready" && refreshed.token) {
      response = await postAuthQuery(query, pars, refreshed.token);
      if (response.status !== 401 && response.status !== 403) {
        return response;
      }
    }

    console.log(
      `callAuthApi: token rejected by server for query "${query}", redirecting to login`
    );
    await signInWithRedirect();
    return;
  }

  return response;
};
