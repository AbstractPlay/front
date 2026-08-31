import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useStore } from "../stores";

let inflight = null;

const DEFAULT_EXPIRY_BUFFER_SEC = 300;

const EMPTY_IDENTITY = {
  userId: null,
  username: null,
  email: null,
};

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

function guestSession() {
  return {
    status: "guest",
    token: null,
    ...EMPTY_IDENTITY,
  };
}

function loadingSession() {
  return {
    status: "loading",
    token: null,
    ...EMPTY_IDENTITY,
  };
}

async function readAmplifySession() {
  const [authSession, currentUser] = await Promise.all([
    fetchAuthSession(),
    getCurrentUser(),
  ]);
  const token = authSession.tokens?.idToken?.toString();
  if (!token) {
    return guestSession();
  }

  const payload = authSession.tokens.idToken.payload ?? {};
  return {
    status: "ready",
    token,
    userId: currentUser.userId,
    username: payload["cognito:username"] ?? currentUser.username ?? null,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}

function startAmplifyFetch({ silent = false } = {}) {
  if (inflight) {
    return inflight;
  }

  const { setAuthSession } = useStore.getState();
  if (!silent) {
    setAuthSession(loadingSession());
  }

  inflight = readAmplifySession()
    .then((session) => {
      useStore.getState().setAuthSession(session);
      return session;
    })
    .catch(() => {
      const session = guestSession();
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
