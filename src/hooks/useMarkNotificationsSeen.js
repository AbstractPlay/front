import { useCallback } from "react";
import { callAuthApi } from "../lib/api";
import { useStore } from "../stores";

async function parseNotificationsResponse(res) {
  if (!res || res.status !== 200) {
    return null;
  }
  const result = await res.json();
  if (result.statusCode !== 200) {
    return null;
  }
  const body = JSON.parse(result.body);
  return body.notifications ?? null;
}

export function useMarkNotificationsSeen({ onError } = {}) {
  return useCallback(
    async (pars = {}) => {
      try {
        const res = await callAuthApi("mark_notifications_seen", pars);
        const notifications = await parseNotificationsResponse(res);
        if (!notifications) {
          return;
        }
        const { setGlobalMe } = useStore.getState();
        setGlobalMe((prev) => ({
          ...prev,
          notifications,
        }));
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    },
    [onError]
  );
}
