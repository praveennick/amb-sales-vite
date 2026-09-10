import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

export async function grantAdminByEmail(email) {
  await httpsCallable(
    getFunctions(app, "us-central1"),
    "grantAdminByEmail",
  )({ email });
}
