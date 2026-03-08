/**
 * App.jsx — Root component with React Router.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAppStore from "./store/appStore";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditorPage from "./pages/EditorPage";

function ProtectedRoute({ children }) {
  const token = useAppStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const token = useAppStore((s) => s.token);
  if (token) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:repoId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
