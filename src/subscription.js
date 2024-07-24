import { PUSH_VAPID_PUBLIC_KEY, PUSH_API_URL } from "./config";
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

function sendSubscription(token, subscription) {
  return fetch(`${PUSH_API_URL}`, {
    method: "POST",
    body: JSON.stringify({
      query: "save_push",
      pars: { payload: subscription },
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function subscribeUser(token) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(function (registration) {
        if (!registration.pushManager) {
          console.log("Push manager unavailable.");
          return;
        }

        registration.pushManager
          .getSubscription()
          .then(function (existedSubscription) {
            if (existedSubscription === null) {
              console.log("No subscription detected, make a request.");
              registration.pushManager
                .subscribe({
                  applicationServerKey: convertedVapidKey,
                  userVisibleOnly: true,
                })
                .then(function (newSubscription) {
                  console.log("New subscription added.");
                  sendSubscription(token, newSubscription);
                })
                .catch(function (e) {
                  if (Notification.permission !== "granted") {
                    console.log("Permission was not granted.");
                  } else {
                    console.error(
                      "An error occurred during the subscription process.",
                      e
                    );
                  }
                });
            } else {
              console.log("Existing subscription detected.");
              sendSubscription(token, existedSubscription);
            }
          });
      })
      .catch(function (e) {
        console.error(
          "An error occurred during Service Worker registration.",
          e
        );
      });
  }
}
