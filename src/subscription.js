import { PUSH_VAPID_PUBLIC_KEY } from "./config";
import { callAuthApi } from "./lib/api";

const convertedVapidKey = urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY);

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  // eslint-disable-next-line
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function vapidKeysMatch(existingKey) {
  if (!existingKey) {
    return false;
  }
  const existingBytes = new Uint8Array(existingKey);
  if (existingBytes.length !== convertedVapidKey.length) {
    return false;
  }
  return existingBytes.every((byte, index) => byte === convertedVapidKey[index]);
}

async function clearPushSubscription(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription !== null) {
    await subscription.unsubscribe();
  }
}

async function createPushSubscription(registration) {
  return registration.pushManager.subscribe({
    applicationServerKey: convertedVapidKey,
    userVisibleOnly: true,
  });
}

async function ensurePushSubscription(registration) {
  let subscription = await registration.pushManager.getSubscription();

  if (
    subscription !== null &&
    !vapidKeysMatch(subscription.options?.applicationServerKey)
  ) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (subscription !== null) {
    return subscription;
  }

  try {
    return await createPushSubscription(registration);
  } catch (error) {
    const isPushServiceError =
      error?.name === "AbortError" ||
      String(error?.message || "").includes("push service error");

    if (!isPushServiceError) {
      throw error;
    }

    await clearPushSubscription(registration);
    return createPushSubscription(registration);
  }
}

async function sendSubscription(subscription) {
  const res = await callAuthApi("save_push", {
    payload: subscription.toJSON(),
  });
  if (!res) {
    throw new Error("Not authenticated");
  }
  if (!res.ok) {
    throw new Error(`save_push failed with status ${res.status}`);
  }
  return res;
}

async function localUnsubscribe() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (!registration.pushManager) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (subscription !== null) {
    await subscription.unsubscribe();
  }
}

export async function getLocalPushSubscription() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  if (!registration.pushManager) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

export async function isPushEnabledOnDevice() {
  if (!("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") {
    return false;
  }

  const subscription = await getLocalPushSubscription();
  return subscription !== null;
}

export async function subscribeUser({
  requestPermission = true,
  silent = false,
} = {}) {
  if (!("serviceWorker" in navigator)) {
    return { success: false, error: "Service workers are not supported." };
  }
  if (!("Notification" in window)) {
    return { success: false, error: "Notifications are not supported." };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    if (!requestPermission) {
      return { success: false, skipped: true };
    }
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return {
      success: false,
      skipped: !requestPermission,
      error: "Notification permission was not granted.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      return { success: false, error: "Push manager is unavailable." };
    }

    const subscription = await ensurePushSubscription(registration);
    await sendSubscription(subscription);
    return { success: true };
  } catch (error) {
    const log = silent ? console.debug : console.error;
    log("An error occurred during the subscription process.", error);
    return {
      success: false,
      error: error?.message || "Failed to subscribe to push notifications.",
    };
  }
}

export async function resyncPushSubscription() {
  return subscribeUser({ requestPermission: false, silent: true });
}

export async function deletePushSubscription() {
  try {
    const subscription = await getLocalPushSubscription();
    if (subscription !== null) {
      const res = await callAuthApi("delete_push", {
        endpoint: subscription.endpoint,
      });
      if (!res) {
        throw new Error("Not authenticated");
      }
      if (!res.ok) {
        throw new Error(`delete_push failed with status ${res.status}`);
      }
      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (error) {
    console.error("An error occurred during deletePushSubscription.", error);
    return {
      success: false,
      error: error?.message || "Failed to disable push on this device.",
    };
  }
}

export async function unregisterAllDevices() {
  try {
    const res = await callAuthApi("set_push", { state: false });
    if (!res) {
      throw new Error("Not authenticated");
    }
    if (!res.ok) {
      throw new Error(`set_push failed with status ${res.status}`);
    }
    await localUnsubscribe();
    return { success: true };
  } catch (error) {
    console.error("An error occurred during unregisterAllDevices.", error);
    return {
      success: false,
      error:
        error?.message || "Failed to unregister push on all devices.",
    };
  }
}
