import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { adminEmails } from "../adminEmails";
import { AuthContext } from "./auth";
import useInactivityTimeout from "../components/common/useInactivityTimeout";
import ToastHandler from "../components/common/ToastHandler";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (next) => {
          setUser(next);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        },
      ),
    [],
  );
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
      isAdmin: Boolean(user && adminEmails.includes(user.email)),
    }),
    [user, loading, error, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
