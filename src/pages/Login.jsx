import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/auth";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
export default function Login() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function signIn(google = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (google) await signInWithPopup(auth, new GoogleAuthProvider());
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in was cancelled. Please try again."
          : err.code === "auth/too-many-requests"
            ? "Too many attempts. Please wait before trying again."
            : "Unable to sign in. Check your details and connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <LoadingSpinner />;
  if (user) {
    const from = location.state?.from?.pathname;
    return (
      <Navigate
        to={
          from?.startsWith("/") && !from.startsWith("//") && from !== "/login"
            ? from
            : isAdmin
              ? "/dashboard"
              : "/shopSelection"
        }
        replace
      />
    );
  }
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-linear-to-br from-slate-950 via-indigo-950 to-violet-900 p-12 text-white lg:flex xl:p-20">
        <div className="text-xl font-bold">
          AMB Sales
          <span className="ml-3 text-sm font-normal text-cyan-300">
            Business workspace
          </span>
        </div>
        <div>
          <p className="mb-5 text-sm font-medium uppercase tracking-widest text-cyan-300">
            Every shop. One clear view.
          </p>
          <h1 className="max-w-xl text-5xl leading-tight font-semibold tracking-tight">
            A better day starts with a clear picture.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-indigo-100/75">
            Keep your daily sales, expenses, and stock together. Less time on
            the numbers, more time on your business.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 border-t border-indigo-800 pt-6 text-sm text-indigo-100">
            <span>Daily sales</span>
            <span>Shop insights</span>
            <span>Inventory</span>
          </div>
        </div>
        <p className="text-sm text-cyan-300/70">
          Built for your everyday operations.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-700 font-bold text-white">
              A
            </span>
            <span className="text-xl font-bold">AMB Sales</span>
          </div>
          <p className="text-sm font-semibold text-violet-700">WELCOME BACK</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in to your workspace
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Use your team account to get started.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <div>
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <input
                className="field"
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                className="field"
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              OR
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button
              type="button"
              disabled={busy}
              className="btn-secondary w-full"
              onClick={() => signIn(true)}
            >
              Continue with Google
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            Access is available to your authorized team members.
          </p>
        </div>
      </section>
    </main>
  );
}
