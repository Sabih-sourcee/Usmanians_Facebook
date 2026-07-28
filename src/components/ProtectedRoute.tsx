import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, authStatus } = useAuth();

  if (authStatus === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center app-canvas">
        <span
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authStatus === "pendingApproval") {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
