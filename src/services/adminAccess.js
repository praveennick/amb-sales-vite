import { collection, db, doc, getDocs, setDoc } from "./firebaseDb";

export async function grantAdminByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(collection(db, "users"));
  const account = snapshot.docs
    .map((item) => ({ uid: item.id, ...item.data() }))
    .find((item) => item.email?.toLowerCase() === normalizedEmail);
  if (!account) {
    const error = new Error("No account found with this email.");
    error.code = "account-not-found";
    throw error;
  }
  await setDoc(doc(db, "admins", account.uid), {
    active: true,
    email: account.email,
  });
}
