import { getFirestore } from "firebase/firestore";
import { app } from "../firebase";

// Database code is loaded only by pages that need data, not by the login page.
export const db = getFirestore(app);
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
