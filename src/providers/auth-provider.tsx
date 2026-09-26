"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import type { LoginFormValues, SignupFormValues } from "@/features/auth/schemas/auth.schema";
import { authClient } from "@/features/auth/services/auth.service";
import type { AuthUser } from "@/types/auth.types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (values: LoginFormValues) => Promise<AuthUser>;
  signup: (values: SignupFormValues) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refetchUser = async () => {
    try {
      const currentUser = await authClient.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = async (values: LoginFormValues) => {
    const loggedInUser = await authClient.login(values);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (values: SignupFormValues) => {
    const registeredUser = await authClient.signup(values);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    // Clear local state and redirect instantly — don't wait for the API
    setUser(null);
    router.push(ROUTES.LOGIN);
    // Fire-and-forget: clear httpOnly cookies on the server
    authClient.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
