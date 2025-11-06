// src/hooks/useAuth.tsx (or your file path)

import { useState, useEffect, createContext, useContext, ReactNode, createElement } from "react";
import { authAPI, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // This now represents the loading state for ANY auth operation
  const [isLoading, setIsLoading] = useState(true);

  // This useEffect for initializing auth is correct and unchanged
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authAPI.getCurrentUser(token);
        setUser(currentUser);
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    // ✅ 1. Set loading to true before starting the API call
    setIsLoading(true);
    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      const currentUser = await authAPI.getCurrentUser(response.token);
      setUser(currentUser);
    } catch (error) {
        // Re-throw the error so the LoginForm can catch it and show a toast
        throw error;
    } finally {
      // ✅ 3. Set loading to false after the process is complete (success or fail)
      setIsLoading(false);
      console.log(user);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    // ✅ Apply the same pattern to the register function
    setIsLoading(true);
    try {
        const response = await authAPI.register(username, email, password);
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);
        const currentUser = await authAPI.getCurrentUser(response.token);
        setUser(currentUser);
    } catch(error) {
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    authAPI.logout();
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return createElement(AuthContext.Provider, { value: contextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}