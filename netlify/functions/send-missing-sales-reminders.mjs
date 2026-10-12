import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const stores = [
  "The Juice Hut",
  "Bubble Tea N Cotton Candy",
  "Coffee N Candy",
];

function indiaDate(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function firestoreDate(isoDate) {
  return isoDate.split("-").reverse().join("-");
}

function firebaseApp() {
  if (getApps().length) return getApps()[0];
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!value) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  return initializeApp({ credential: cert(JSON.parse(value)) });
}

export default async () => {
  const app = firebaseApp();
  const db = getFirestore(app);
  const date = indiaDate();
  const pathDate = firestoreDate(date);
  const sales = await Promise.all(
    stores.map((store) => db.doc(`shops/${store}/${pathDate}/data`).get()),
  );
  const missingStores = stores.filter((_, index) => !sales[index].exists);
  if (!missingStores.length) {
    console.log("All stores submitted sales", { date });
    return new Response(null, { status: 204 });
  }

  const submitted = new Set(
    sales
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => snapshot.get("submittedBy")?.toLowerCase())
      .filter(Boolean),
  );
  const userSnapshots = await db
    .collection("users")
    .where("active", "==", true)
    .get();

  for (const snapshot of userSnapshots.docs) {
    const user = snapshot.data();
    if (!user.email || submitted.has(user.email.toLowerCase())) continue;
    const tokenSnapshots = await snapshot.ref.collection("notificationTokens").get();
    const tokens = tokenSnapshots.docs
      .map((token) => ({ id: token.id, token: token.get("token"), ref: token.ref }))
      .filter(({ token }) => token);
    if (!tokens.length) continue;

    const marker = db.doc(`notificationReminders/${date}_${snapshot.id}`);
    if ((await marker.get()).exists) continue;
    const shortStoreNames = {
      "The Juice Hut": "Juice Hut",
      "Bubble Tea N Cotton Candy": "Bubble Tea",
      "Coffee N Candy": "Coffee Shop",
    };
    const missingNames = missingStores
      .map((store) => shortStoreNames[store] || store)
      .join(", ");
    const response = await getMessaging(app).sendEachForMulticast({
      tokens: tokens.map(({ token }) => token),
      webpush: {
        notification: {
          title: "🔴 SALES NOT ENTERED",
          body: `Tap here and enter today's sales now: ${missingNames}.`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "amb-sales-reminder",
          renotify: true,
          requireInteraction: true,
          data: { link: "/stores" },
        },
      },
      data: { link: "/stores", salesDate: date },
    });
    const invalid = response.responses
      .map((result, index) => ({ result, token: tokens[index] }))
      .filter(({ result }) =>
        [
          "messaging/invalid-registration-token",
          "messaging/registration-token-not-registered",
        ].includes(result.error?.code),
      );
    await Promise.all(invalid.map(({ token }) => token.ref.delete()));
    if (response.successCount) {
      await marker.set({
        uid: snapshot.id,
        email: user.email,
        date,
        missingStores,
        sentAt: new Date(),
        successCount: response.successCount,
      });
    }
    console.log("Sales reminder processed", {
      uid: snapshot.id,
      date,
      sent: response.successCount,
      failed: response.failureCount,
    });
  }

  return new Response(null, { status: 204 });
};

// Netlify cron uses UTC. 15:30 UTC is 21:00 Asia/Kolkata.
export const config = { schedule: "30 15 * * *" };
