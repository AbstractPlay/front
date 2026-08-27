import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../config";
import {
  getAuthTokenFromSession,
  refreshAuthSession,
} from "./authSession";

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

// Set requireAuth to false to you are calling this from a flow that is supported for non-logged in users
export const callAuthApi = async (query, pars, requireAuth = true) => {
  const token = await getAuthToken();
  if (token === null) {
    if (requireAuth) {
      await Auth.federatedSignIn();
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
    await Auth.federatedSignIn();
    return;
  }

  return response;
};
