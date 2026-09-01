import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";

const REF_STORAGE_KEY = "usmanian_signup_ref";

export const SignupPage: React.FC = () => {
  const [params] = useSearchParams();
  const refFromUrl = params.get("ref") || undefined;

  useEffect(() => {
    if (refFromUrl) sessionStorage.setItem(REF_STORAGE_KEY, refFromUrl);
  }, [refFromUrl]);

  const referralCode = refFromUrl || sessionStorage.getItem(REF_STORAGE_KEY) || undefined;

  return (
    <main className="auth-canvas relative w-full min-h-dvh flex flex-col items-center justify-center font-body-md text-on-surface p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <AuthCard initialMode="signup" referralCode={referralCode} />
        <div className="mt-6 w-16 h-1 bg-primary rounded-full mx-auto" aria-hidden="true" />
      </div>
    </main>
  );
};
