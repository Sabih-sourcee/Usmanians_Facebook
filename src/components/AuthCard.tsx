import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AuthCardProps {
  initialMode?: "login" | "signup" | "pending";
}

const inputClass =
  "w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors duration-200";

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode }) => {
  const { authStatus, login, signup, logout, refreshProfile, authError, clearAuthError } =
    useAuth();
  const navigate = useNavigate();

  const [internalMode, setInternalMode] = useState<"login" | "signup">(
    initialMode === "signup" ? "signup" : "login"
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCid, setSignupCid] = useState("");
  const [signupClass, setSignupClass] = useState("");
  const [signupCampus, setSignupCampus] = useState("Main Campus");

  useEffect(() => {
    if (initialMode === "signup") setInternalMode("signup");
    else if (initialMode === "login") setInternalMode("login");
  }, [initialMode]);

  useEffect(() => {
    clearAuthError();
    setFormError(null);
  }, [internalMode, clearAuthError]);

  const currentView =
    authStatus === "pendingApproval"
      ? "pending"
      : authStatus === "loggedIn"
        ? "loggedIn"
        : internalMode;

  const displayError = formError || authError;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    const { error } = await login(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    // ProtectedRoute / PublicOnlyRoute will redirect based on verification_status
    navigate("/");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (signupPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    const { error } = await signup({
      fullName: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      cid: signupCid.trim(),
      className: signupClass.trim(),
      campus: signupCampus,
    });
    setIsLoading(false);

    if (error) {
      setFormError(error);
      return;
    }

    navigate("/pending-approval");
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    setFormError(null);
    await refreshProfile();
    setIsLoading(false);
  };

  if (currentView === "loggedIn") {
    return (
      <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-lg text-center space-y-md">
        <h2 className="text-headline-md text-on-surface">You are logged in</h2>
        <p className="text-body-md text-on-surface-variant">Welcome back to Usmanian portal.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full min-h-[48px] bg-primary text-on-primary font-semibold rounded-xl cursor-pointer hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Go to home feed
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {currentView === "login" && (
        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-lg space-y-lg">
          <div className="flex flex-col items-center text-center space-y-sm">
            <div className="p-sm bg-surface-container-lowest rounded-full mb-xs">
              <img
                alt="Usman Public School System shield"
                className="w-20 h-20 object-contain"
                width={80}
                height={80}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVIUzDnIFUHGtQMvhfXn3_Wvt8RQ4LP6sY9fsXDrBirg&s=10"
              />
            </div>
            <div className="space-y-xs w-full">
              <h1 className="text-headline-lg text-primary">Usmanian</h1>
              <p className="text-body-md text-on-surface-variant">
                Private network for Usman Public School System students &amp; alumni
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-lg w-full">
            <div className="space-y-md w-full">
              <div className="space-y-xs w-full">
                <label className="text-label-md text-on-surface block" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  className={inputClass}
                  id="login-email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@alumni.edu"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-xs w-full">
                <label className="text-label-md text-on-surface block" htmlFor="login-password">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    className={`${inputClass} pr-12`}
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {displayError && (
              <p className="text-label-md text-error" role="alert">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setInternalMode("signup");
                navigate("/signup");
              }}
              className="min-h-[44px] px-md text-label-md text-primary hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
            >
              Don't have an account? <span className="font-semibold">Sign up</span>
            </button>
          </div>
        </div>
      )}

      {currentView === "signup" && (
        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-lg space-y-lg">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back to login"
              onClick={() => {
                setInternalMode("login");
                navigate("/login");
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-headline-md text-on-surface">Create account</h2>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-lg w-full">
            <div className="space-y-md w-full">
              <div className="space-y-xs w-full">
                <label className="text-label-md text-on-surface block" htmlFor="signup-name">
                  Full Name
                </label>
                <input
                  className={inputClass}
                  id="signup-name"
                  autoComplete="name"
                  placeholder="Abdullah Usman"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-xs w-full">
                <label className="text-label-md text-on-surface block" htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  className={inputClass}
                  id="signup-email"
                  autoComplete="email"
                  placeholder="name@alumni.edu"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-xs w-full">
                <label className="text-label-md text-on-surface block" htmlFor="signup-password">
                  Password
                </label>
                <input
                  className={inputClass}
                  id="signup-password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-xs w-full">
                <div className="flex items-center justify-between gap-sm">
                  <label className="text-label-md text-on-surface" htmlFor="signup-cid">
                    Student ID / CID
                  </label>
                  <span className="inline-flex items-center gap-xs text-secondary text-label-sm font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Official only
                  </span>
                </div>
                <input
                  className={inputClass}
                  id="signup-cid"
                  placeholder="CID-000000"
                  type="text"
                  value={signupCid}
                  onChange={(e) => setSignupCid(e.target.value)}
                  required
                />
                <p className="text-label-sm text-on-surface-variant">
                  Verification required — Usmanian accounts only
                </p>
              </div>

              <div className="grid grid-cols-2 gap-md w-full">
                <div className="space-y-xs min-w-0">
                  <label className="text-label-md text-on-surface block" htmlFor="signup-class">
                    Class/Section
                  </label>
                  <input
                    className={inputClass}
                    id="signup-class"
                    placeholder="Year 2-B"
                    type="text"
                    value={signupClass}
                    onChange={(e) => setSignupClass(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-xs min-w-0">
                  <label className="text-label-md text-on-surface block" htmlFor="signup-campus">
                    Campus
                  </label>
                  <div className="relative">
                    <select
                      className={`${inputClass} appearance-none pr-10`}
                      id="signup-campus"
                      value={signupCampus}
                      onChange={(e) => setSignupCampus(e.target.value)}
                    >
                      <option value="Main Campus">Main Campus</option>
                      <option value="West Wing">West Wing</option>
                      <option value="Alumni Hub">Alumni Hub</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {displayError && (
              <p className="text-label-md text-error" role="alert">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Processing...
                </span>
              ) : (
                "Request access"
              )}
            </button>
          </form>
        </div>
      )}

      {currentView === "pending" && (
        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-xl space-y-lg text-center">
          <div className="flex justify-center py-md text-primary">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="space-y-sm">
            <h2 className="text-headline-md text-on-surface">Account under review</h2>
            <p className="text-body-md text-on-surface-variant">
              To maintain community integrity, registrations are manually verified by school administrators.
            </p>
          </div>

          <div className="bg-surface-container-low p-md rounded-lg flex items-start gap-md text-left">
            <svg className="w-5 h-5 text-secondary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-label-md text-on-surface">
              Verification usually takes 24–48 hours. You'll receive a notification once confirmed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={isLoading}
            className="w-full min-h-[44px] py-sm px-md bg-secondary/10 hover:bg-secondary/20 text-secondary text-body-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:opacity-50"
          >
            {isLoading ? "Checking…" : "Check verification status"}
          </button>

          <button
            type="button"
            aria-label="Return to login screen"
            onClick={async () => {
              await logout();
              setInternalMode("login");
              navigate("/login");
            }}
            className="w-full min-h-[48px] bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-dim transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            Return to login
          </button>
        </div>
      )}
    </div>
  );
};
