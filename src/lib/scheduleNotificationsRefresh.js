import { debounce } from "lodash";
import { fetchNotifications } from "./globalMeBootstrap";
import { useStore } from "../stores";

const debouncedFetch = debounce(() => {
  if (useStore.getState().globalMe?.id) {
    fetchNotifications();
  }
}, 400);

export function scheduleNotificationsRefresh() {
  debouncedFetch();
}

export function cancelScheduledNotificationsRefresh() {
  debouncedFetch.cancel();
}
