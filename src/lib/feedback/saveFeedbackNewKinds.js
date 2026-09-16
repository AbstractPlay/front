import { cloneDeep } from "lodash";
import { callAuthApi } from "../api";
import { fetchProfile } from "../globalMeBootstrap";
import { defaultFeedbackNewKinds } from "../notificationPrefs";

export async function saveFeedbackNewKinds(globalMe, kind, enabled) {
  const newSettings = cloneDeep(globalMe.settings ?? {});
  if (newSettings.all === undefined) {
    newSettings.all = {};
  }
  const kinds = defaultFeedbackNewKinds(newSettings.all.feedbackNewKinds);
  kinds[kind] = enabled;
  newSettings.all.feedbackNewKinds = kinds;
  const res = await callAuthApi("update_user_settings", {
    settings: newSettings,
  });
  if (!res || res.status !== 200) {
    throw new Error("Failed to save notification preferences");
  }
  await fetchProfile();
  return kinds;
}
