import React from "react";
import { AuthCard } from "../components/AuthCard";

export const LoginPage: React.FC = () => {
  return (
    <main className="auth-canvas relative w-full min-h-dvh flex flex-col items-center justify-center font-body-md text-on-surface p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <AuthCard initialMode="login" />
        <div className="mt-6 w-16 h-1 bg-primary rounded-full mx-auto" aria-hidden="true" />
      </div>
    </main>
  );
};
