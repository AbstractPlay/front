import { Auth } from "aws-amplify";
import { useStore } from "../stores";

let inflight = null;

export async function resolveAuthSession({ force = false } = {}) {
  const { authSession, setAuthSession } = useStore.getState();
  if (!force && authSession.status === "ready") {
    return authSession;
  }
  if (!force && authSession.status === "guest") {
    return authSession;
  }
  if (!force && inflight) {
    return inflight;
  }

  setAuthSession({ status: "loading", user: null, token: null });
  inflight = Auth.currentAuthenticatedUser()
    .then((user) => {
      const session = {
        status: "ready",
        user,
        token: user.signInUserSession.idToken.jwtToken,
      };
      useStore.getState().setAuthSession(session);
      return session;
    })
    .catch(() => {
      const session = { status: "guest", user: null, token: null };
      useStore.getState().setAuthSession(session);
      return session;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function refreshAuthSession() {
  useStore.getState().clearAuthSession();
  return resolveAuthSession({ force: true });
}

export async function getAuthTokenFromSession() {
  const session = await resolveAuthSession();
  return session.status === "ready" ? session.token : null;
}
