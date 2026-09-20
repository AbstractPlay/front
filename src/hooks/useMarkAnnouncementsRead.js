import { useCallback } from "react";
import { markAnnouncementsRead } from "../lib/announcements/announcementEngagementApi";
import { fetchProfile } from "../lib/globalMeBootstrap";
import { useStore } from "../stores";

export function useMarkAnnouncementsRead() {
  const setGlobalMe = useStore((state) => state.setGlobalMe);

  return useCallback(async (readAt) => {
    const result = await markAnnouncementsRead(readAt);
    if (!result.ok) {
      return result;
    }
    const serverReadAt = result.data?.announcementsLastReadAt;
    if (serverReadAt !== undefined) {
      setGlobalMe((prev) => {
        if (!prev) {
          return prev;
        }
        const settings = { ...(prev.settings ?? {}) };
        const all = { ...(settings.all ?? {}) };
        all.announcementsLastReadAt = serverReadAt;
        settings.all = all;
        return { ...prev, settings };
      });
    }
    await fetchProfile();
    return result;
  }, [setGlobalMe]);
}
