import React from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/dashboards/AdminDashboard";
import FacultyDashboard from "./pages/dashboards/FacultyDashboard";
import HODDashboard from "./pages/dashboards/HODDashboard";
import PrincipalDashboard from "./pages/dashboards/PrincipalDashboard";

import Landing from "./pages/Landing";
import Login from "./pages/Login";

const DashboardRedirect = ({ user }) => {

  const routeMap = {
    faculty: "/faculty",
    hod: "/hod",
    principal: "/principal",
    admin: "/admin",
  };

  return (
    <Navigate
      to={routeMap[user?.role] || "/login"}
      replace
    />
  );

};

export default function App() {

  return (
    <Routes>

      {/* Landing Page */}

      <Route
        path="/"
        element={
          <Landing />
        }
      />

      {/* Login */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* Dashboard Redirect */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {({ user }) => (
              <DashboardRedirect user={user} />
            )}
          </ProtectedRoute>
        }
      />

      {/* Faculty */}

      <Route
        path="/faculty"
        element={
          <ProtectedRoute roles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* HOD */}

      <Route
        path="/hod"
        element={
          <ProtectedRoute roles={["hod"]}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />

      {/* Principal */}

      <Route
        path="/principal"
        element={
          <ProtectedRoute roles={["principal"]}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin */}

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>

  );

}
