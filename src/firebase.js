import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
export { app, auth };
