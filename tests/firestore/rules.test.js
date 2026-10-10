import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

const projectId = "demo-amb-sales-rules";
let environment;

const sale = (email = "staff@example.com") => ({
  upi: 200,
  card: 50,
  expenses: 50,
  counterCash: 100,
  posSale: 1200,
  cashGiven: 900,
  notes500: 2,
  notes200: 0,
  notes100: 0,
  notes50: 0,
  notes20: 0,
  notes10: 0,
  cash: 950,
  totalSale: 1200,
  remaining: 0,
  shopName: "The Juice Hut",
  submittedBy: email,
  submissionDate: serverTimestamp(),
  revisionId: "initial-revision-0001",
});

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "approved"), {
      email: "staff@example.com",
      active: true,
    });
    await setDoc(doc(db, "users", "pending"), {
      email: "pending@example.com",
      active: false,
    });
    await setDoc(doc(db, "users", "admin"), {
      email: "admin@example.com",
      active: true,
    });
    await setDoc(doc(db, "admins", "admin"), {
      email: "admin@example.com",
      active: true,
    });
  });
});

after(async () => environment?.cleanup());

test("new accounts can only register themselves as pending", async () => {
  const db = environment
    .authenticatedContext("new-user", { email: "new@example.com" })
    .firestore();
  await assertSucceeds(
    setDoc(doc(db, "users", "new-user"), {
      email: "new@example.com",
      active: false,
    }),
  );
  await assertFails(
    setDoc(doc(db, "users", "attacker"), {
      email: "new@example.com",
      active: false,
    }),
  );
  await assertFails(
    updateDoc(doc(db, "users", "new-user"), { active: true }),
  );
});

test("anonymous and pending accounts cannot write sales", async () => {
  const path = ["shops", "The Juice Hut", "02-10-2026", "data"];
  await assertFails(
    setDoc(doc(environment.unauthenticatedContext().firestore(), ...path), sale()),
  );
  const pending = environment
    .authenticatedContext("pending", { email: "pending@example.com" })
    .firestore();
  await assertFails(setDoc(doc(pending, ...path), sale("pending@example.com")));
});

test("approved staff can write valid sales but cannot forge values", async () => {
  const db = environment
    .authenticatedContext("approved", { email: "staff@example.com" })
    .firestore();
  const reference = doc(db, "shops", "The Juice Hut", "02-10-2026", "data");
  await assertSucceeds(setDoc(reference, sale()));
  await assertFails(setDoc(reference, { ...sale(), totalSale: 99999 }));
  await assertFails(setDoc(reference, { ...sale(), submittedBy: "other@example.com" }));
  await assertFails(setDoc(reference, { ...sale(), unexpected: true }));
});

test("replacements require matching immutable history visible only to admins", async () => {
  const staff = environment
    .authenticatedContext("approved", { email: "staff@example.com" })
    .firestore();
  const dataPath = ["shops", "The Juice Hut", "02-10-2026", "data"];
  const path = ["shops", "The Juice Hut", "02-10-2026", "data", "history", "version-2"];
  const current = (await getDoc(doc(staff, ...dataPath))).data();
  const history = {
    previous: current,
    replacedBy: "staff@example.com",
    replacedAt: serverTimestamp(),
  };
  await assertFails(
    setDoc(doc(staff, ...dataPath), { ...sale(), revisionId: "version-without-history" }),
  );
  const batch = writeBatch(staff);
  batch.set(doc(staff, ...path), history);
  batch.set(doc(staff, ...dataPath), { ...sale(), revisionId: "version-2" });
  await assertSucceeds(batch.commit());
  await assertFails(getDoc(doc(staff, ...path)));
  await assertFails(updateDoc(doc(staff, ...path), { replacedAt: "changed" }));
  const admin = environment
    .authenticatedContext("admin", { email: "admin@example.com" })
    .firestore();
  const snapshot = await assertSucceeds(getDoc(doc(admin, ...path)));
  assert.equal(snapshot.data().replacedBy, "staff@example.com");
});
