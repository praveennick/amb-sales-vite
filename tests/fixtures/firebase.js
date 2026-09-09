import { localDate, documentDate } from "../../src/lib/format";
const listeners = new Set();
export const auth = {},
  db = {};
export class GoogleAuthProvider {}
const getUser = () =>
  localStorage.getItem("test-role") === "guest"
    ? null
    : {
        uid: "test-user",
        displayName: "Test Team",
        email:
          localStorage.getItem("test-role") === "staff"
            ? "staff@example.com"
            : "admin@abc.com",
      };
export function onAuthStateChanged(_auth, listener) {
  listeners.add(listener);
  queueMicrotask(() => {
    if (listeners.has(listener)) listener(getUser());
  });
  return () => listeners.delete(listener);
}
export async function signOut() {
  localStorage.setItem("test-role", "guest");
  listeners.forEach((listener) => listener(null));
}
export async function signInWithEmailAndPassword() {
  localStorage.setItem("test-role", "admin");
  listeners.forEach((listener) => listener(getUser()));
}
export const signInWithPopup = signInWithEmailAndPassword;
const path = (_db, ...parts) => parts.join("/");
export const doc = path,
  collection = path;
let sequence = 0;
const store = new Map();
window.__testReads = [];
window.__testWrites = [];
async function wait() {
  await new Promise((resolve) =>
    setTimeout(resolve, Number(localStorage.getItem("test-delay")) || 10),
  );
  if (localStorage.getItem("test-fail") === "true")
    throw new Error("Simulated offline");
}
export async function getDoc(reference) {
  window.__testReads.push(reference);
  await wait();
  const saved = store.get(reference);
  const date = reference.split("/")[2];
  const current = date === documentDate(localDate());
  const data =
    saved ||
    (current
      ? {
          totalSale: 1250,
          posSale: 1300,
          remaining: -50,
          cash: 500,
          upi: 500,
          card: 250,
          cashGiven: 500,
          submittedBy: "staff@example.com",
          notes500: 1,
          expenses: 0,
          counterCash: 0,
        }
      : null);
  return { exists: () => Boolean(data), data: () => data };
}
export async function getDocs(reference) {
  window.__testReads.push(reference);
  await wait();
  if (!store.has(reference)) {
    const rows = reference.startsWith("inventory/")
      ? [
          {
            id: "sugar",
            name: "Sugar",
            unit: "kg",
            open: "10",
            buy: "5",
            waste: "1",
            sold: "2",
          },
        ]
      : reference.includes(documentDate(localDate()))
        ? [{ id: "milk", title: "Milk", price: 80 }]
        : [];
    store.set(reference, rows);
  }
  return {
    docs: store
      .get(reference)
      .map(({ id, ...data }) => ({ id, data: () => ({ ...data }) })),
  };
}
export async function setDoc(reference, data) {
  await wait();
  store.set(reference, data);
  window.__testWrites.push({ reference, data });
}
export async function addDoc(reference, data) {
  await wait();
  const id = "new-" + ++sequence;
  store.set(reference, [...(store.get(reference) || []), { ...data, id }]);
  window.__testWrites.push({ reference, data });
  return { id };
}
export async function updateDoc(reference, data) {
  await wait();
  const key = reference.slice(0, reference.lastIndexOf("/")),
    id = reference.split("/").at(-1);
  store.set(
    key,
    store
      .get(key)
      .map((item) => (item.id === id ? { ...item, ...data } : item)),
  );
  window.__testWrites.push({ reference, data });
}
export async function deleteDoc(reference) {
  await wait();
  const key = reference.slice(0, reference.lastIndexOf("/")),
    id = reference.split("/").at(-1);
  store.set(
    key,
    store.get(key).filter((item) => item.id !== id),
  );
  window.__testWrites.push({ reference });
}
