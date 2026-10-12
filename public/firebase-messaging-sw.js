/* global firebase, importScripts, clients */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDhxxjc2EZ4-e8VBMVD6Ivv7Kvq40Oy8gw",
  authDomain: "amb-sales.firebaseapp.com",
  projectId: "amb-sales",
  storageBucket: "amb-sales.appspot.com",
  messagingSenderId: "764940470142",
  appId: "1:764940470142:web:7772f546884bac0eb1152f",
});

firebase.messaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification?.data?.link || "/stores", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return clients.openWindow(target);
    }),
  );
});
