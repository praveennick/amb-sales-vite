import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/auth";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/common/AppLayout/AppLayout";
import LoadingSpinner from "./components/common/LoadingSpinner/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { shops } from "./lib/shops";
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ShopSelection = lazy(() => import("./pages/ShopSelection"));
const DataSubmission = lazy(() => import("./pages/SalesSubmission"));
const DailySpends = lazy(() => import("./pages/DailySpends"));
const InventoryPage = lazy(() => import("./pages/Inventory"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const Records = lazy(() => import("./pages/SalesRecords"));
function Home() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner />;
  return (
    <Navigate
      to={user ? (isAdmin ? "/dashboard" : "/stores") : "/login"}
      replace
    />
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ToastContainer limit={3} />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              {[
                ["/shopSelection", "/stores"],
                ["/daily-spends", "/expenses"],
                ["/testing", "/sales-records"],
                ...shops.map((shop) => [
                  shop.path.replace("/sales/", "/submit/"),
                  shop.path,
                ]),
              ].map(([previous, current]) => (
                <Route
                  key={previous}
                  path={previous}
                  element={<Navigate to={current} replace />}
                />
              ))}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/stores" element={<ShopSelection />} />
                  {shops.map((shop) => (
                    <Route
                      key={shop.path}
                      path={shop.path}
                      element={
                        <DataSubmission key={shop.name} shopName={shop.name} />
                      }
                    />
                  ))}
                  <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="/admin-access" element={<AdminAccess />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/expenses" element={<DailySpends />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/sales-records" element={<Records />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
