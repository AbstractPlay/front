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

export async function subscribeUser() {
  if (!("serviceWorker" in navigator)) {
    return { success: false, error: "Service workers are not supported." };
  }
  if (!("Notification" in window)) {
    return { success: false, error: "Notifications are not supported." };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { success: false, error: "Notification permission was not granted." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      return { success: false, error: "Push manager is unavailable." };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (subscription === null) {
      subscription = await registration.pushManager.subscribe({
        applicationServerKey: convertedVapidKey,
        userVisibleOnly: true,
      });
    }

    await sendSubscription(subscription);
    return { success: true };
  } catch (error) {
    console.error("An error occurred during the subscription process.", error);
    return {
      success: false,
      error: error?.message || "Failed to subscribe to push notifications.",
    };
  }
}

export async function unsubscribeUser() {
  if (!("serviceWorker" in navigator)) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      return { success: true };
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription !== null) {
      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (error) {
    console.error("An error occurred during unsubscribe.", error);
    return {
      success: false,
      error: error?.message || "Failed to unsubscribe from push notifications.",
    };
  }
}
