import { API_ENDPOINT_OPEN } from "../config";
import { useStore } from "../stores";

const MIN_REFETCH_INTERVAL_MS = 5 * 60 * 1000;
let lastFetchMs = 0;
let inflight = null;

export async function fetchUserNames({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastFetchMs < MIN_REFETCH_INTERVAL_MS) {
    return useStore.getState().users;
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const { setUsers, setUsersLoaded } = useStore.getState();
    try {
      const url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "user_names");
      const res = await fetch(url);
      const result = await res.json();
      setUsers(result);
      lastFetchMs = Date.now();
      return result;
    } catch (error) {
      console.log(error);
      setUsers([]);
      return [];
    } finally {
      setUsersLoaded(true);
      inflight = null;
    }
  })();

  return inflight;
}
