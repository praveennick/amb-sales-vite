import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhxxjc2EZ4-e8VBMVD6Ivv7Kvq40Oy8gw",
  authDomain: "amb-sales.firebaseapp.com",
  projectId: "amb-sales",
  storageBucket: "amb-sales.appspot.com",
  messagingSenderId: "764940470142",
  appId: "1:764940470142:web:7772f546884bac0eb1152f",
  measurementId: "G-2MMXHECS2S",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized:", app);
console.log("Firestore instance:", db);
console.log("Auth instance:", auth);

export {
  auth,
  db,
  collection,
  setDoc,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc
};
