import { gameinfo } from "@abstractplay/gameslib";
import { compareStrings } from "../compareStrings";

let coderUserIdsCache;

export function getCoderUserIds() {
  if (!coderUserIdsCache) {
    const ids = new Set();
    for (const entry of gameinfo.values()) {
      for (const person of entry.people ?? []) {
        if (person.type === "coder" && person.apid) {
          ids.add(person.apid);
        }
      }
    }
    coderUserIdsCache = ids;
  }
  return coderUserIdsCache;
}

export function isPriorityReviewerUser(user, coderUserIds = getCoderUserIds()) {
  return Boolean(user?.admin) || coderUserIds.has(user?.id);
}

export function groupUsersForReviewerPicker(users, { coderUserIds, language } = {}) {
  const coderIds = coderUserIds ?? getCoderUserIds();
  const available = users.filter((user) => !user.bot);
  const priority = [];
  const others = [];

  for (const user of available) {
    if (isPriorityReviewerUser(user, coderIds)) {
      priority.push(user);
    } else {
      others.push(user);
    }
  }

  const sorter = (a, b) => compareStrings(a.name ?? "", b.name ?? "", language);
  priority.sort(sorter);
  others.sort(sorter);

  return { priority, others };
}
