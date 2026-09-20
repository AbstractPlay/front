import { callAuthApi } from "../api";
import { parseAuthResponse } from "../parseAuthResponse";

export async function markAnnouncementsRead(readAt) {
  const pars = readAt !== undefined ? { readAt } : {};
  const res = await callAuthApi("announcements_mark_read", pars);
  return parseAuthResponse(res);
}

export async function reactToAnnouncement(id, emoji) {
  const res = await callAuthApi("announcement_react", { id, emoji });
  return parseAuthResponse(res);
}

export async function fetchAnnouncementReactionsMine(ids) {
  const res = await callAuthApi("announcement_reactions_mine", { ids });
  return parseAuthResponse(res);
}
