import { useCallback } from "react";
import { callAuthApi } from "../lib/api";
import { useStore } from "../stores";

export function useDismissNotification({ onError } = {}) {
  return useCallback(
    async (sk) => {
      try {
        const res = await callAuthApi("dismiss_notification", { sk });
        if (!res) {
          return;
        }
        if (res.status !== 200) {
          console.log("An error occurred while dismissing notification.");
          return;
        }
        const { setGlobalMe } = useStore.getState();
        setGlobalMe((prev) => ({
          ...prev,
          notifications: (prev.notifications ?? []).filter((n) => n.sk !== sk),
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
