import React from "react";
import { Navigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export const PendingApprovalPage: React.FC = () => {
  const { authStatus, isAuthenticated } = useAuth();

  if (authStatus === "loading") {
    return (
      <main className="auth-canvas relative w-full min-h-dvh flex flex-col items-center justify-center">
        <span
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
          aria-label="Loading"
        />
      </main>
    );
  }

  if (authStatus === "loggedOut") {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="auth-canvas relative w-full min-h-dvh flex flex-col items-center justify-center font-body-md text-on-surface p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <AuthCard initialMode="pending" />
        <div className="mt-6 w-16 h-1 bg-primary rounded-full mx-auto" aria-hidden="true" />
      </div>
    </main>
  );
};
