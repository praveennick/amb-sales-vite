import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

import { AuthContext } from "./auth";
import useInactivityTimeout from "../components/common/useInactivityTimeout";
import ToastHandler from "../components/common/ToastHandler";

export default function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let generation = 0;
    let stopRole = () => {};
    let stopAccess = () => {};
    const stopAuth = onAuthStateChanged(
      auth,
      async (next) => {
        const current = ++generation;
        stopRole();
        stopAccess();
        setUser(next);
        setIsAdmin(false);
        setIsAuthorized(false);
        setError(null);
        setLoading(Boolean(next));
        if (!next) return;
        try {
          const { db, doc, getDoc, onSnapshot, setDoc } =
            await import("../services/firebaseDb");
          if (current !== generation) return;
          const userReference = doc(db, "users", next.uid);
          const existingUser = await getDoc(userReference);
          if (current !== generation) return;
          if (!existingUser.exists())
            await setDoc(userReference, {
              email: next.email || "",
              active: false,
            });
          let accessLoaded = false;
          let roleLoaded = false;
          const finishLoading = () => {
            if (accessLoaded && roleLoaded) setLoading(false);
          };
          stopAccess = onSnapshot(
            userReference,
            (snapshot) => {
              if (current !== generation) return;
              const data = snapshot.data();
              // Records created before approvals were introduced remain valid.
              setIsAuthorized(snapshot.exists() && data.active !== false);
              accessLoaded = true;
              finishLoading();
            },
            (err) => {
              if (current !== generation) return;
              setError(err);
              accessLoaded = true;
              finishLoading();
            },
          );
          stopRole = onSnapshot(
            doc(db, "admins", next.uid),
            (snapshot) => {
              if (current !== generation) return;
              setIsAdmin(snapshot.exists() && snapshot.data().active === true);
              roleLoaded = true;
              finishLoading();
            },
            (err) => {
              if (current !== generation) return;
              setError(err);
              setIsAdmin(false);
              roleLoaded = true;
              finishLoading();
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
      stopAccess();
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
      isAuthorized: isAuthorized || isAdmin,
    }),
    [user, loading, error, logout, isAdmin, isAuthorized],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
