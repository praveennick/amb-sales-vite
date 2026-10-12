import {
  collection,
  db,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "./firebaseDb";
import { app } from "../firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

async function tokenId(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function notificationsAvailable() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Boolean(vapidKey)
  );
}

export function notificationPermission() {
  return "Notification" in window ? Notification.permission : "unsupported";
}

export async function enableNotifications(user) {
  if (!vapidKey)
    throw new Error("Notification setup is missing the Firebase VAPID key.");
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    throw new Error("This browser does not support push notifications.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error("Notification permission was not granted.");

  const [{ getMessaging, getToken }, registration] = await Promise.all([
    import("firebase/messaging"),
    navigator.serviceWorker.register("/firebase-messaging-sw.js"),
  ]);
  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Firebase did not return a notification token.");

  const id = await tokenId(token);
  await setDoc(doc(dbForUser(user.uid), id), {
    token,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  localStorage.setItem(`amb-sales-fcm-token:${user.uid}`, token);
  return token;
}

export async function disableNotifications(user) {
  const token = localStorage.getItem(`amb-sales-fcm-token:${user.uid}`);
  if (!token) return;
  const id = await tokenId(token);
  await deleteDoc(doc(dbForUser(user.uid), id));
  try {
    const { deleteToken, getMessaging } = await import("firebase/messaging");
    await deleteToken(getMessaging(app));
  } finally {
    localStorage.removeItem(`amb-sales-fcm-token:${user.uid}`);
  }
}

export function notificationsEnabled(user) {
  return Boolean(localStorage.getItem(`amb-sales-fcm-token:${user.uid}`));
}

function dbForUser(uid) {
  return collection(db, "users", uid, "notificationTokens");
}
