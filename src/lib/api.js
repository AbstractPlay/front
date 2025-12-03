import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../config";

// Set requireAuth to false to you are calling this from a flow that is supported for non-logged in users
export const callAuthApi = async (query, pars, requireAuth = true) => {
  let usr;
  let token;
  try {
    usr = await Auth.currentAuthenticatedUser();
    token = usr.signInUserSession.idToken.jwtToken;
  } catch (err) {
    if (requireAuth) {
      await Auth.federatedSignIn();
    }
    return;
  }

  const response = await fetch(API_ENDPOINT_AUTH, {
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

  // Handle expired/invalid token from backend
  if (response.status === 401 || response.status === 403) {
    console.log(
      `callAuthApi: token rejected by server for query "${query}", redirecting to login`
    );
    await Auth.federatedSignIn();
    return;
  }

  return response;
};
