import { Auth } from "aws-amplify";
import { useStore } from "../stores";

let inflight = null;

const DEFAULT_EXPIRY_BUFFER_SEC = 300;

export function getJwtExpiryMs(token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(
  token,
  { bufferSec = DEFAULT_EXPIRY_BUFFER_SEC } = {}
) {
  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs === null) {
    return true;
  }
  return Date.now() >= expiryMs - bufferSec * 1000;
}

function startAmplifyFetch({ silent = false } = {}) {
  if (inflight) {
    return inflight;
  }

  const { setAuthSession } = useStore.getState();
  if (!silent) {
    setAuthSession({ status: "loading", user: null, token: null });
  }

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

export async function resolveAuthSession({ force = false } = {}) {
  const { authSession } = useStore.getState();
  if (!force && authSession.status === "ready") {
    return authSession;
  }
  if (!force && authSession.status === "guest") {
    return authSession;
  }
  if (!force && inflight) {
    return inflight;
  }

  return startAmplifyFetch({ silent: false });
}

export function refreshAuthSession() {
  useStore.getState().clearAuthSession();
  return resolveAuthSession({ force: true });
}

export async function getAuthTokenFromSession() {
  const { authSession } = useStore.getState();
  if (
    authSession.status === "ready" &&
    authSession.token &&
    !isJwtExpired(authSession.token)
  ) {
    return authSession.token;
  }

  const session = await startAmplifyFetch({ silent: true });
  return session.status === "ready" ? session.token : null;
}
