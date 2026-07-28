import React, { createContext, useContext, useState, ReactNode } from "react";
import { mockUser, UserProfile } from "../data/mockUser";

export type AuthStatus = "loggedOut" | "pendingApproval" | "loggedIn";

export interface SignupData {
  fullName: string;
  cid: string;
  className: string;
  campus: string;
  email?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  user: UserProfile | null;
  pendingUserData: SignupData | null;
  login: (email?: string, password?: string) => void;
  signup: (signupData: SignupData) => void;
  simulateApproval: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loggedOut");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingUserData, setPendingUserData] = useState<SignupData | null>(null);

  const isAuthenticated = authStatus === "loggedIn";

  const login = (email?: string, _password?: string) => {
    setAuthStatus("loggedIn");
    setUser({
      ...mockUser,
      email: email || mockUser.email,
    });
    setPendingUserData(null);
  };

  const signup = (signupData: SignupData) => {
    setPendingUserData(signupData);
    setAuthStatus("pendingApproval");
    setUser(null);
  };

  const simulateApproval = () => {
    setAuthStatus("loggedIn");
    setUser({
      ...mockUser,
      name: pendingUserData?.fullName || mockUser.name,
      badgeText: pendingUserData ? `${pendingUserData.className.toUpperCase()} • ${pendingUserData.campus.toUpperCase()}` : mockUser.badgeText,
    });
    setPendingUserData(null);
  };

  const logout = () => {
    setAuthStatus("loggedOut");
    setUser(null);
    setPendingUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authStatus,
        user,
        pendingUserData,
        login,
        signup,
        simulateApproval,
        logout,
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
