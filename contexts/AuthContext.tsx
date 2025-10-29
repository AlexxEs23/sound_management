"use client";

import { apiClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import React, { createContext, useState, useCallback, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  noWa: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/auth/me");
      if (res.status === 200 && res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post("/auth/logout");
      if (res.status === 200) {
        setUser(null);
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Even if API call fails, clear user and redirect
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch user on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, refreshUser, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

// Custom hook untuk menggunakan AuthContext
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
