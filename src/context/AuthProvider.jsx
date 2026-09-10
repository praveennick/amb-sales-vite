import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

import { AuthContext } from "./auth";
import useInactivityTimeout from "../components/common/useInactivityTimeout";
import ToastHandler from "../components/common/ToastHandler";

export default function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let generation = 0;
    let stopRole = () => {};
    const stopAuth = onAuthStateChanged(
      auth,
      async (next) => {
        const current = ++generation;
        stopRole();
        setUser(next);
        setIsAdmin(false);
        setError(null);
        setLoading(Boolean(next));
        if (!next) return;
        try {
          const { db, doc, onSnapshot, setDoc } =
            await import("../services/firebaseDb");
          if (current !== generation) return;
          if (next.email) {
            setDoc(doc(db, "users", next.uid), {
              email: next.email,
            }).catch(() => {});
          }
          stopRole = onSnapshot(
            doc(db, "admins", next.uid),
            (snapshot) => {
              if (current !== generation) return;
              setIsAdmin(snapshot.exists() && snapshot.data().active === true);
              setLoading(false);
            },
            (err) => {
              if (current !== generation) return;
              setError(err);
              setIsAdmin(false);
              setLoading(false);
            },
          );
        } catch (err) {
          if (current !== generation) return;
          setError(err);
          setLoading(false);
        }
      },
      (err) => {
        generation++;
        stopRole();
        setIsAdmin(false);
        setError(err);
        setLoading(false);
      },
    );
    return () => {
      generation++;
      stopAuth();
      stopRole();
    };
  }, []);
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      ToastHandler.error("Could not sign out. Please try again.");
    }
  }, []);
  useInactivityTimeout(logout, Boolean(user));
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      logout,
      isAdmin,
    }),
    [user, loading, error, logout, isAdmin],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
