/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
self.addEventListener('push', event => {
    const promiseChain = isClientFocused().then((clientIsFocused) => {
        const data = event.data.json()
        const options = {
          body: data.body,
          tag: data.topic,
          icon: "/favicon.ico",
          data: {
            url: data.url,
          }
        }
        if (clientIsFocused) {
            console.log("is focused");
            clients
            .matchAll({
              type: 'window',
              includeUncontrolled: true,
            }).then((windowClients) => {
                windowClients.forEach((windowClient) => {
                    console.log("sending message");
                    windowClient.postMessage(options);
                });
            });
          return;
        }

        // Client isn't focused, we need to show a notification.
        return self.registration.showNotification(data.title, options);
    });
    event.waitUntil(promiseChain);
});


function isClientFocused() {
    return clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        let clientIsFocused = false;

        for (let i = 0; i < windowClients.length; i++) {
          const windowClient = windowClients[i];
          if (windowClient.focused) {
            clientIsFocused = true;
            break;
          }
        }

        return clientIsFocused;
      });
}

self.addEventListener("notificationclick", event => {
    const data = event.notification.data;
    if ( (data !== undefined) && ("url" in data) && (data.url !== undefined) && (data.url.length > 0)) {
        const urlToOpen = new URL(data.url, self.location.origin).href;

        const promiseChain = clients
          .matchAll({
            type: 'window',
            includeUncontrolled: true,
          })
          .then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
              const windowClient = windowClients[i];
              if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
              }
            }

            if (matchingClient) {
              return matchingClient.focus();
            } else {
              return clients.openWindow(urlToOpen);
            }
          });

        event.waitUntil(promiseChain);
    }
});
