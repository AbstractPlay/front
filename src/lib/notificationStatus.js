export function isNotificationNew(notification) {
  return notification?.status === "new" || notification?.status === undefined;
}
