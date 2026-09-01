import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { ProfileRow } from "../types/database";
import type { UserProfile } from "../types/models";
import { profileToUser, loadProfileStats } from "../lib/api/profiles";
import { PointsService } from "../lib/api/points";
import { flushPendingReferral, storePendingReferralCode } from "../lib/api/referrals";
import { isStudentCidAvailable } from "../lib/api/auth";
import { DUPLICATE_CID_MESSAGE, normalizeAuthError } from "../lib/authErrors";

export type AuthStatus = "loading" | "loggedOut" | "pendingApproval" | "loggedIn";

export interface SignupData {
  fullName: string;
  cid: string;
  className: string;
  campus: string;
  email: string;
  password: string;
  referralCode?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  user: UserProfile | null;
  profile: ProfileRow | null;
  session: Session | null;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (signupData: SignupData) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function statusFromProfile(profile: ProfileRow | null, hasSession: boolean): AuthStatus {
  if (!hasSession) return "loggedOut";
  if (!profile) return "pendingApproval";
  if (profile.verification_status === "approved") return "loggedIn";
  return "pendingApproval";
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticated = authStatus === "loggedIn";

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const loadProfile = useCallback(async (authUser: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile:", error.message);
      setProfile(null);
      setUser(null);
      setAuthStatus("pendingApproval");
      return null;
    }

    const nextProfile = (data as ProfileRow | null) ?? null;
    setProfile(nextProfile);

    if (nextProfile) {
      const stats =
        nextProfile.verification_status === "approved"
          ? await loadProfileStats(authUser.id)
          : { posts: 0, followers: 0, notes: 0 };
      setUser(profileToUser(nextProfile, authUser.email || "", stats));
    } else {
      setUser(null);
    }

    setAuthStatus(statusFromProfile(nextProfile, true));

    if (nextProfile) {
      // Retries any referral that failed to record at signup time (e.g. a
      // transient RPC error). Idempotent, so safe to call on every load.
      void flushPendingReferral();
    }

    if (nextProfile?.verification_status === "approved") {
      void PointsService.claimDailyLogin();
    }

    return nextProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setSession(null);
      setProfile(null);
      setUser(null);
      setAuthStatus("loggedOut");
      return;
    }
    await loadProfile(authUser);
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!mounted) return;
      setSession(initial);
      if (initial?.user) {
        void loadProfile(initial.user);
      } else {
        setAuthStatus("loggedOut");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => {
          void loadProfile(nextSession.user);
        }, 0);
      } else {
        setProfile(null);
        setUser(null);
        setAuthStatus("loggedOut");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const message = normalizeAuthError(error);
        setAuthError(message);
        return { error: message };
      }

      if (data.user) {
        await loadProfile(data.user);
      }

      return { error: null };
    },
    [loadProfile]
  );

  const signup = useCallback(
    async (signupData: SignupData) => {
      setAuthError(null);

      const cidAvailable = await isStudentCidAvailable(signupData.cid);
      if (cidAvailable === false) {
        setAuthError(DUPLICATE_CID_MESSAGE);
        return { error: DUPLICATE_CID_MESSAGE };
      }

      // Persist before calling signUp so the referral survives even if the
      // page unloads (e.g. email confirmation redirect) before loadProfile's
      // flush completes.
      if (signupData.referralCode) {
        storePendingReferralCode(signupData.referralCode);
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email.trim(),
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName.trim(),
            student_cid: signupData.cid.trim(),
            class_name: signupData.className.trim(),
            campus: signupData.campus.trim(),
          },
        },
      });

      if (error) {
        const message = normalizeAuthError(error);
        setAuthError(message);
        return { error: message };
      }

      if (data.user) {
        await loadProfile(data.user);
      } else {
        setAuthStatus("pendingApproval");
      }

      return { error: null };
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setUser(null);
    setAuthStatus("loggedOut");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authStatus,
        user,
        profile,
        session,
        authError,
        clearAuthError,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
