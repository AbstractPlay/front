import { API_ENDPOINT_OPEN } from "../config";
import { useStore } from "../stores";

const MIN_REFETCH_INTERVAL_MS = 5 * 60 * 1000;
let lastFetchFilteredMs = 0;
let lastFetchAllMs = 0;
/** True when the store last received a full-directory `user_names` response. */
let directoryIncludesAll = false;
let inflight = null;

function parseUserNamesPayload(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw.body === "string") {
    try {
      const parsed = JSON.parse(raw.body);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function requestUserNames(all) {
  const res = await fetch(API_ENDPOINT_OPEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "user_names",
      pars: all ? { all: true } : {},
    }),
  });
  const raw = await res.json();
  return parseUserNamesPayload(raw);
}

/**
 * @param {{ force?: boolean, all?: boolean }} [opts]
 */
export async function fetchUserNames({ force = false, all = false } = {}) {
  const wantAll = all === true;
  const now = Date.now();
  const lastMs = wantAll ? lastFetchAllMs : lastFetchFilteredMs;

  if (!force && now - lastMs < MIN_REFETCH_INTERVAL_MS) {
    const users = useStore.getState().users;
    if (wantAll && !directoryIncludesAll) {
      // fall through — need full catalog
    } else {
      return users;
    }
  }

  if (inflight && inflight.all === wantAll) {
    return inflight.promise;
  }

  const promise = (async () => {
    const { setUsers, setUsersLoaded } = useStore.getState();
    try {
      const result = await requestUserNames(wantAll);
      setUsers(result);
      const fetchedAt = Date.now();
      if (wantAll) {
        lastFetchAllMs = fetchedAt;
        directoryIncludesAll = true;
      } else {
        lastFetchFilteredMs = fetchedAt;
        directoryIncludesAll = false;
      }
      return result;
    } catch (error) {
      console.log(error);
      setUsers([]);
      return [];
    } finally {
      setUsersLoaded(true);
      if (inflight?.promise === promise) {
        inflight = null;
      }
    }
  })();

  inflight = { all: wantAll, promise };
  return promise;
}

/** Load the full player directory if the store only has the default active subset. */
export async function ensureFullUserDirectory() {
  if (directoryIncludesAll) {
    return useStore.getState().users;
  }
  return fetchUserNames({ all: true, force: false });
}

/** Whether the zustand store was last populated from `pars.all`. */
export function userDirectoryIncludesAll() {
  return directoryIncludesAll;
}
