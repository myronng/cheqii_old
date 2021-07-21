/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/// <reference lib="webworker" />
// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true
// listen to message event from window
self.addEventListener("message", event => {
  // HOW TO TEST THIS?
  // Run this in your browser console:
  //     window.navigator.serviceWorker.controller.postMessage({command: 'log', message: 'hello world'})
  // OR use next-pwa injected workbox object
  //     window.workbox.messageSW({command: 'log', message: 'hello world'})
  console.log(event === null || event === void 0 ? void 0 : event.data);
});
self.addEventListener("push", event => {
  const data = JSON.parse((event === null || event === void 0 ? void 0 : event.data.text()) || "{}");
  event === null || event === void 0 ? void 0 : event.waitUntil(self.registration.showNotification(data.title, {
    body: data.message,
    icon: "/icons/android-chrome-192x192.png"
  }));
});
self.addEventListener("notificationclick", event => {
  event === null || event === void 0 ? void 0 : event.notification.close();
  event === null || event === void 0 ? void 0 : event.waitUntil(self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then(function (clientList) {
    if (clientList.length > 0) {
      let client = clientList[0];

      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].focused) {
          client = clientList[i];
        }
      }

      return client.focus();
    }

    return self.clients.openWindow("/");
  }));
});

/******/ })()
;