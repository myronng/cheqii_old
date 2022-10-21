/// <reference lib="webworker" />

// import { initializeApp } from "firebase/app";
// import { getAuth, getIdToken, onAuthStateChanged } from "firebase/auth";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true

// const FIREBASE_CONFIG = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// const app = initializeApp(FIREBASE_CONFIG);

// const auth = getAuth();
// const getIdTokenPromise = () =>
//   new Promise<string | null>((resolve, reject) => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       unsubscribe();
//       if (user) {
//         getIdToken(user).then(
//           (idToken) => {
//             resolve(idToken);
//           },
//           (error) => {
//             resolve(null);
//           }
//         );
//       } else {
//         resolve(null);
//       }
//     });
//   });

// const getOriginFromUrl = (url: string) => {
//   // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
//   const pathArray = url.split("/");
//   const protocol = pathArray[0];
//   const host = pathArray[2];
//   return protocol + "//" + host;
// };

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
  new StaleWhileRevalidate({
    cacheName: "static-font-assets",
  })
);

registerRoute(
  /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
  new StaleWhileRevalidate({
    cacheName: "static-image-assets",
  })
);

registerRoute(
  /\/_next\/image\?url=.+$/i,
  new StaleWhileRevalidate({
    cacheName: "next-image",
  })
);

registerRoute(
  /\.(?:js)$/i,
  new NetworkFirst({
    cacheName: "static-js-assets",
    networkTimeoutSeconds: 10,
  })
);

registerRoute(
  /\.(?:css)$/i,
  new NetworkFirst({
    cacheName: "static-style-assets",
    networkTimeoutSeconds: 10,
  })
);

registerRoute(
  /\/_next\/data\/.+\/.+\.json$/i,
  new NetworkFirst({
    cacheName: "next-data",
    networkTimeoutSeconds: 10,
  })
);

registerRoute(
  /\.(?:json|xml|csv)$/i,
  new NetworkFirst({
    cacheName: "static-data-assets",
    networkTimeoutSeconds: 10,
  })
);

// registerRoute(
//   ({ url }) => {
//     const isSameOrigin = self.origin === url.origin;
//     return !isSameOrigin;
//   },
//   new NetworkFirst({
//     cacheName: "cross-origin",
//     networkTimeoutSeconds: 10,
//   })
// );

// registerRoute(
//   ({ url }) => {
//     const isSameOrigin = self.origin === url.origin;
//     return isSameOrigin;
//   },
//   new NetworkFirst({
//     cacheName: "navigation",
//     networkTimeoutSeconds: 10,
//   })
// );

// self.addEventListener("fetch", async (event) => {
//   // Check if this is a navigation request
//   if (event.request.mode === "navigate") {
//     // Open the cache
//     const cache = await caches.open("others");
//     try {
//       // Go to the network first
//       let networkRequest: Request;
//       const token = await getIdTokenPromise();
//       // For same origin https requests, append idToken to header
//       if (
//         self.location.origin == getOriginFromUrl(event.request.url) &&
//         (self.location.protocol == "https:" || self.location.hostname == "localhost") &&
//         token
//       ) {
//         // Clone headers as request headers are immutable.
//         const headers = new Headers(event.request.headers);
//         // Add ID token to header.
//         headers.append("Authorization", "Bearer " + token);

//         // Create authorized request
//         const { url, ...props } = event.request.clone();
//         networkRequest = new Request(url, {
//           ...props,
//           mode: "same-origin",
//           headers,
//         });
//       } else {
//         networkRequest = event.request;
//       }
//       const networkResponse = await fetch(networkRequest);

//       // expiration: {
//       //   maxEntries: 32,
//       //   maxAgeSeconds: 60 * 60, // 1 hour
//       // },
//       // networkTimeoutSeconds: 10,
//       cache.put(event.request, networkResponse.clone());
//       event.respondWith(networkResponse);
//     } catch (err) {
//       // If network is unavailable, get
//       return caches.match(event.request.url);
//     }
//   } else {
//     return;
//   }
// });

// // listen to message event from window
// self.addEventListener("message", (event) => {
//   // HOW TO TEST THIS?
//   // Run this in your browser console:
//   //     window.navigator.serviceWorker.controller.postMessage({command: 'log', message: 'hello world'})
//   // OR use next-pwa injected workbox object
//   //     window.workbox.messageSW({command: 'log', message: 'hello world'})
//   // console.log(event?.data);
// });

// self.addEventListener("push", (event) => {
//   if (event?.data) {
//     const data = JSON.parse(event.data.text() || "{}");
//     event?.waitUntil(
//       self.registration.showNotification(data.title, {
//         body: data.message,
//         icon: "/icons/android-chrome-192x192.png",
//       })
//     );
//   }
// });

// self.addEventListener("notificationclick", (event) => {
//   event?.notification.close();
//   event?.waitUntil(
//     self.clients
//       .matchAll({ type: "window", includeUncontrolled: true })
//       .then(function (clientList) {
//         if (clientList.length > 0) {
//           let client = clientList[0];
//           for (let i = 0; i < clientList.length; i++) {
//             if (clientList[i].focused) {
//               client = clientList[i];
//             }
//           }
//           return client.focus();
//         }
//         return self.clients.openWindow("/");
//       })
//   );
// });

export {};
