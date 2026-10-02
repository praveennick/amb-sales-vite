import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth";
import LoadingSpinner from "./LoadingSpinner/LoadingSpinner";
import { FaClock, FaSignOutAlt, FaUserShield } from "react-icons/fa";
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, error, isAdmin, isAuthorized, logout } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner fullScreen />;
  if (error)
    return (
      <div role="alert" className="panel m-6">
        Unable to check your session. Please reload and try again.
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAuthorized)
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-linear-to-br from-indigo-50 via-white to-fuchsia-50 p-5">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-cyan-200/40 blur-3xl" />
        <section
          role="alert"
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white bg-white/90 p-6 shadow-2xl shadow-indigo-200/50 backdrop-blur sm:p-10"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
              <FaUserShield aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold">AMB Sales</p>
              <p className="text-xs text-slate-500">Business workspace</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600 ring-4 ring-amber-50/60">
              <FaClock aria-hidden="true" />
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Approval pending
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Access awaiting approval
          </h1>
          <p className="mt-3 leading-relaxed text-slate-600">
            An administrator needs to approve your account before the workspace
            becomes available.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Signed in as
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-800">
              {user.email}
            </p>
          </div>
          <div className="mt-3 rounded-2xl bg-violet-50/70 p-4 text-sm leading-relaxed text-slate-600">
            You can leave this page open. Access will update automatically when
            an administrator approves your account.
          </div>
          <button className="btn-secondary mt-6 w-full justify-center" onClick={logout}>
            <FaSignOutAlt aria-hidden="true" /> Sign out
          </button>
        </section>
      </main>
    );
  if (adminOnly && !isAdmin) return <Navigate to="/stores" replace />;
  return children || <Outlet />;
}
