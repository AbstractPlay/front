import { useStore } from "../stores";

const RETRY_DELAYS_MS = [250, 1000];

let retryTimers = [];

export function cancelWatchGamesSync() {
  for (const timer of retryTimers) {
    clearTimeout(timer);
  }
  retryTimers = [];
}

export function scheduleWatchGamesSync() {
  cancelWatchGamesSync();
  useStore.getState().syncWatchGames();
  for (const delay of RETRY_DELAYS_MS) {
    retryTimers.push(
      setTimeout(() => {
        useStore.getState().syncWatchGames();
      }, delay)
    );
  }
}
