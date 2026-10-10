import { db, doc, serverTimestamp, setDoc } from "./firebaseDb";

export function addActivity(batch, user, action, details = {}) {
  batch.set(doc(db, "activity", crypto.randomUUID()), {
    action,
    actorEmail: user.email || "",
    actorUid: user.uid,
    createdAt: serverTimestamp(),
    details,
  });
}

export async function recordActivity(user, action, details = {}) {
  try {
    await setDoc(doc(db, "activity", crypto.randomUUID()), {
      action,
      actorEmail: user.email || "",
      actorUid: user.uid,
      createdAt: serverTimestamp(),
      details,
    });
  } catch {
    // Audit logging must never block the business operation it describes.
  }
}
