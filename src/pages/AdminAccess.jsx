import { useEffect, useState } from "react";
import {
  FaBan,
  FaCheck,
  FaUserShield,
  FaTrashAlt,
  FaUsers,
  FaUserClock,
} from "react-icons/fa";
import { useAuth } from "../context/auth";
import {
  db,
  collection,
  doc,
  onSnapshot,
  writeBatch,
} from "../services/firebaseDb";
import useConfirmDialog from "../components/common/useConfirmDialog";
import { recordActivity } from "../services/activity";
import { displayTimestamp } from "../lib/format";

export default function AdminAccess() {
  const { user, isAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { confirm, confirmationDialog } = useConfirmDialog();
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
  useEffect(
    () =>
      onSnapshot(
        collection(db, "users"),
        (snapshot) =>
          setMembers(
            snapshot.docs.map((item) => ({ ...item.data(), uid: item.id })),
          ),
        () =>
          setError("Could not load team access. Check Firebase permissions."),
      ),
    [],
  );
  useEffect(
    () =>
      onSnapshot(collection(db, "activity"), (snapshot) =>
        setActivities(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 20),
        ),
      ),
    [],
  );
  async function setMemberAccess(member, active) {
    if (!isAdmin || busy || member.uid === user.uid) return;
    const memberIsAdmin = admins.some((admin) => admin.uid === member.uid);
    if (!(await confirm({
      title: active ? "Approve team member?" : "Revoke workspace access?",
      message: active
        ? `${member.email} will be able to use the sales workspace.`
        : `${member.email} will be signed out of the workspace.${memberIsAdmin ? " Their administrator role will also be removed." : ""}`,
      confirmLabel: active ? "Approve access" : "Revoke access",
      danger: !active,
      success: active,
    }))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", member.uid), { active });
      if (!active && memberIsAdmin) batch.delete(doc(db, "admins", member.uid));
      await batch.commit();
      void recordActivity(user, active ? "member.approved" : "member.revoked", {
        email: member.email,
        removedAdmin: !active && memberIsAdmin,
      });
      setNotice(active ? "Team access approved." : "Team access revoked.");
    } catch {
      setError("Could not change team access. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!isAdmin || busy) return;
    if (!(await confirm({
      title: "Grant administrator access?",
      message: `${address} will be able to manage people, reports, inventory, expenses, and sales records.`,
      confirmLabel: "Grant admin access",
    }))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { grantAdminByEmail } = await import("../services/adminAccess.js");
      await grantAdminByEmail(address);
      void recordActivity(user, "admin.granted", { email: address });
      setEmail("");
      setNotice("Admin access granted.");
    } catch (failure) {
      const messages = {
        "account-not-found":
          "No account exists with that email. Ask the user to sign in once, then try again.",
        "permission-denied": "Your account cannot grant admin access.",
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
    if (!(await confirm({
      title: "Remove administrator access?",
      message: `${admin.email} will remain an approved team member but will lose management access.`,
      confirmLabel: "Remove admin",
      danger: true,
    }))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "admins", admin.uid));
      await batch.commit();
      void recordActivity(user, "admin.removed", { email: admin.email });
      setNotice("Admin access removed.");
    } catch {
      setError("Could not remove access. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      {confirmationDialog}
      <div className="page-hero">
        <h2 className="flex items-center gap-3 text-2xl font-semibold">
          <FaUserShield aria-hidden="true" />
          People &amp; access
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          Approve team members and choose who can manage the workspace.
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
      <section className="panel space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <FaUsers aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">Team members</h3>
            <p className="mt-1 text-sm text-slate-500">
              New accounts remain blocked until an administrator approves them.
            </p>
          </div>
        </div>
        {[...members]
          .sort((a, b) => Number(a.active !== false) - Number(b.active !== false))
          .map((member) => {
            const active = member.active !== false;
            return (
              <div
                key={member.uid}
                className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="break-all font-medium">
                    {member.email || "Unknown account"}
                    {member.uid === user.uid ? " (you)" : ""}
                  </p>
                  <p
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {active ? "Approved" : "Awaiting approval"}
                  </p>
                </div>
                {member.uid !== user.uid && (
                  <button
                    className={`${active ? "btn-danger" : "btn-success"} w-full justify-center sm:w-40`}
                    disabled={busy}
                    onClick={() => setMemberAccess(member, !active)}
                  >
                    {active ? <FaBan aria-hidden="true" /> : <FaCheck aria-hidden="true" />}
                    {active ? "Revoke access" : "Approve access"}
                  </button>
                )}
              </div>
            );
          })}
      </section>
      <section className="panel space-y-4">
        <div>
          <h3 className="font-semibold">Recent activity</h3>
          <p className="mt-1 text-sm text-slate-500">The latest access and sales changes.</p>
        </div>
        {!activities.length ? (
          <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="grid gap-1 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-medium">{activity.action.replaceAll(".", " ")}</p>
                <p className="text-xs text-slate-500">{activity.actorEmail}</p>
              </div>
              <time className="text-xs text-slate-400">{displayTimestamp(activity.createdAt)}</time>
            </div>
          ))
        )}
      </section>
      <form className="panel space-y-4" onSubmit={save}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <FaUserClock aria-hidden="true" />
          </span>
          <h3 className="font-semibold">Add an administrator</h3>
        </div>
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
              className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
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
                  className="btn-danger w-full justify-center sm:w-40"
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
