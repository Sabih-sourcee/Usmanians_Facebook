import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { InstallPrompt } from "./components/InstallPrompt";
import { SeoHead } from "./components/SeoHead";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { LandingPage } from "./pages/LandingPage";
import { HomeFeedPage } from "./pages/HomeFeedPage";
import { ProfilePage } from "./pages/ProfilePage";
import { FriendsPage } from "./pages/FriendsPage";
import { ActivityPage } from "./pages/ActivityPage";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage";

const AuthLoading: React.FC = () => (
  <div className="min-h-dvh flex items-center justify-center auth-canvas">
    <span
      className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
      aria-label="Loading"
    />
  </div>
);

/** Logged-out visitors get the SEO landing; members go to the feed. */
const RootEntry: React.FC = () => {
  const { isAuthenticated, authStatus } = useAuth();

  if (authStatus === "loading") return <AuthLoading />;
  if (authStatus === "pendingApproval") {
    return <Navigate to="/pending-approval" replace />;
  }
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <LandingPage />;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authStatus } = useAuth();

  if (authStatus === "loading") return <AuthLoading />;

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  if (authStatus === "pendingApproval") {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

export function AppRoutes() {
  return (
    <>
      <SeoHead />
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/feed" element={<HomeFeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/groups" element={<Navigate to="/friends" replace />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/admin" element={<AdminApprovalsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <InstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}
