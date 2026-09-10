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
export async function grantAdminByEmail(email) {
  await wait();
  if (email === "missing@example.com") {
    const error = new Error("No user");
    error.code = "functions/not-found";
    throw error;
  }
  const reference = "admins/another-user";
  const data = { active: true, email };
  store.set(reference, data);
  window.__testWrites.push({ reference, data });
  roleListeners.forEach((notify) => notify());
}
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
    (store.has(reference) ? saved : undefined) ||
    (current && !store.has(reference)
      ? {
          totalSale: 1250,
          posSale: 1200,
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
  roleListeners.forEach((notify) => notify());
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
  if (reference.startsWith("shops/") || reference.startsWith("admins/")) {
    store.set(reference, null);
  } else {
    const key = reference.slice(0, reference.lastIndexOf("/")),
      id = reference.split("/").at(-1);
    store.set(
      key,
      store.get(key).filter((item) => item.id !== id),
    );
  }
  roleListeners.forEach((notify) => notify());
  window.__testWrites.push({ reference });
}

const roleListeners = new Set();
export function onSnapshot(reference, next) {
  const notify = () => {
    const initial =
      localStorage.getItem("test-role") !== "staff"
        ? { active: true, email: "admin@abc.com" }
        : null;
    const own = store.has("admins/test-user")
      ? store.get("admins/test-user")
      : initial;
    if (reference === "admins") {
      const entries = new Map([
        ["admins/test-user", own],
        ...[...store].filter(([key]) => key.startsWith("admins/")),
      ]);
      next({
        docs: [...entries]
          .filter(([, value]) => value)
          .map(([key, value]) => ({
            id: key.split("/")[1],
            data: () => value,
          })),
      });
    } else next({ exists: () => Boolean(own), data: () => own });
  };
  roleListeners.add(notify);
  queueMicrotask(() => {
    if (roleListeners.has(notify)) notify();
  });
  return () => roleListeners.delete(notify);
}
