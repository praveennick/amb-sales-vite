import { useEffect, useState } from "react";
import { FaUserShield, FaTrashAlt } from "react-icons/fa";
import { useAuth } from "../context/auth";
import {
  db,
  collection,
  doc,
  onSnapshot,
  deleteDoc,
} from "../services/firebaseDb";

export default function AdminAccess() {
  const { user, isAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(
    () =>
      onSnapshot(
        collection(db, "admins"),
        (snapshot) => {
          setAdmins(
            snapshot.docs.map((item) => ({ ...item.data(), uid: item.id })),
          );
          setLoading(false);
        },
        () => {
          setError("Could not load admin access. Check Firebase permissions.");
          setLoading(false);
        },
      ),
    [],
  );
  async function save(event) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!isAdmin || busy) return;
    if (!window.confirm(`Grant full admin access to ${address}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { grantAdminByEmail } = await import("../services/adminAccess.js");
      await grantAdminByEmail(address);
      setEmail("");
      setNotice("Admin access granted.");
    } catch (failure) {
      const messages = {
        "functions/not-found":
          "No account exists with that email. Ask the user to sign in once, then try again.",
        "functions/failed-precondition": "That account is disabled.",
        "functions/permission-denied":
          "Your account cannot grant admin access.",
        "functions/invalid-argument": "Enter a valid email address.",
      };
      setError(
        messages[failure.code] || "Could not grant access. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(admin) {
    if (!isAdmin || busy || admin.uid === user.uid) return;
    if (!window.confirm(`Remove admin access for ${admin.email}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteDoc(doc(db, "admins", admin.uid));
      setNotice("Admin access removed.");
    } catch {
      setError("Could not remove access. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="page-hero">
        <h2 className="flex items-center gap-3 text-2xl font-semibold">
          <FaUserShield aria-hidden="true" />
          Admin access
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          Manage who can view reports, delete sales, and manage your workspace.
        </p>
      </div>
      {error && (
        <p role="alert" className="panel text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="panel text-emerald-700">
          {notice}
        </p>
      )}
      <form className="panel space-y-4" onSubmit={save}>
        <h3 className="font-semibold">Add an administrator</h3>
        <p className="text-sm text-slate-500">
          Enter the email address the person uses to sign in.
        </p>
        <label className="block">
          <span className="field-label">Email address</span>
          <input
            className="field"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
        </label>
        <button className="btn-primary" disabled={busy || loading}>
          Grant admin access
        </button>
      </form>
      <section className="panel space-y-4">
        <h3 className="font-semibold">Administrators</h3>
        {loading ? (
          <p>Loading administrators…</p>
        ) : (
          admins.map((admin) => (
            <div
              key={admin.uid}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
            >
              <div className="min-w-0">
                <p className="break-all font-medium">
                  {admin.email || "Administrator"}
                  {admin.uid === user.uid ? " (you)" : ""}
                </p>
                {admin.active !== true && (
                  <p className="text-xs text-slate-500">Inactive</p>
                )}
              </div>
              {admin.uid !== user.uid && (
                <button
                  className="btn-secondary text-red-700"
                  disabled={busy}
                  onClick={() => remove(admin)}
                  aria-label={`Remove admin ${admin.email || "administrator"}`}
                >
                  <FaTrashAlt aria-hidden="true" />
                  Remove access
                </button>
              )}
            </div>
          ))
        )}
        <p className="text-xs text-slate-500">
          You cannot remove your own admin access.
        </p>
      </section>
    </div>
  );
}
