import { useCallback } from "react";
import { callAuthApi } from "../lib/api";
import { useStore } from "../stores";

export function useDismissAllNotifications({ onError } = {}) {
  return useCallback(async () => {
    try {
      const res = await callAuthApi("dismiss_all_notifications", {});
      if (!res || res.status !== 200) {
        console.log("An error occurred while dismissing all notifications.");
        return;
      }
      const result = await res.json();
      if (result.statusCode !== 200) {
        console.log("An error occurred while dismissing all notifications.");
        return;
      }
      const { setGlobalMe } = useStore.getState();
      setGlobalMe((prev) => ({
        ...prev,
        notifications: [],
      }));
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  }, [onError]);
}
