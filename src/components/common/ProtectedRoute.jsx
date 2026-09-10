import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth";
import LoadingSpinner from "./LoadingSpinner/LoadingSpinner";
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, error, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div role="alert" className="panel m-6">
        Unable to check your session. Please reload and try again.
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/stores" replace />;
  return children || <Outlet />;
}
