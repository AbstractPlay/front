export const EMAIL_NOTIFICATION_KEYS = [
  "challenges",
  "gameStart",
  "gameEnd",
  "yourturn",
  "tournamentStart",
  "tournamentEnd",
];

export const IN_APP_NOTIFICATION_KEYS = [
  "challenges",
  "gameStart",
  "gameEnd",
  "ratingChange",
  "eventInvitation",
  "completedGameChat",
];

function defaultNotificationMap(keys) {
  return Object.fromEntries(keys.map((key) => [key, true]));
}

export function defaultEmailNotifications(existing) {
  const settings = {
    ...defaultNotificationMap(EMAIL_NOTIFICATION_KEYS),
    ...(existing ?? {}),
  };
  for (const key of EMAIL_NOTIFICATION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      settings[key] = true;
    }
  }
  return settings;
}

export function defaultInAppNotifications(existing) {
  const settings = {
    ...defaultNotificationMap(IN_APP_NOTIFICATION_KEYS),
    ...(existing ?? {}),
  };
  for (const key of IN_APP_NOTIFICATION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      settings[key] = true;
    }
  }
  return settings;
}
