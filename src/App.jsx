import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import DataSubmission from "./DataSubmission";
import Dashboard from "./Dashboard";
import ProtectedRoute from "./components/common/ProtectedRoute";
import TestFirestoreConnection from "./TestFirestoreConnection";
import "./App.css";
import AppLayout from "./components/common/AppLayout/AppLayout";
import ShopSelection from "./ShopSelection";
import { ToastContainer } from "react-toastify";
import useInactivityTimeout from "./components/common/useInactivityTimeout";
import JsonDataSubmission from "./JsonDataSubmission";
import DailySpends from "./DailySpends";
import InventoryPage from "./InventoryPage";

const App = () => {
  const [user, setUser] = useState(null);
  const [fallbackImage, setFallbackImage] = useState("");

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
    });
    window.location.href = "/login";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !fallbackImage) {
        const randomImage = `https://www.fakemail.net/avatars/avat_${String(
          Math.floor(Math.random() * 35) + 1
        ).padStart(3, "0")}.png`;
        setFallbackImage(randomImage);
      }
    });
    return unsubscribe;
  }, [fallbackImage]);

  useInactivityTimeout(
    handleLogout,
    () => {
      // Callback function to handle navigation after logout
      window.location.href = "/login";
    },
    1200000
  ); // 20 minutes = 1200000 ms

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <AppLayout
              user={user}
              handleLogout={handleLogout}
              fallbackImage={fallbackImage}
            />
          }
        >
          <Route
            path="/shopSelection"
            element={
              <ProtectedRoute>
                <ShopSelection />
              </ProtectedRoute>
            }
          />

          {/* Admin-only route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Shop submission routes */}
          <Route
            path="/submit/juice-hut"
            element={
              <ProtectedRoute>
                <DataSubmission shopName="The Juice Hut" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit/bubble-tea"
            element={
              <ProtectedRoute>
                <DataSubmission shopName="Bubble Tea N Cotton Candy" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit/coffee-candy"
            element={
              <ProtectedRoute>
                <DataSubmission shopName="Coffee N Candy" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/testing"
            element={
              <ProtectedRoute>
                <TestFirestoreConnection />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/data"
            element={
              <ProtectedRoute>
                <JsonDataSubmission />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/daily-spends"
            element={
              <ProtectedRoute>
                <DailySpends />
              </ProtectedRoute>
            }
          />
          <Route path="/inventory" element={<InventoryPage />} />

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
