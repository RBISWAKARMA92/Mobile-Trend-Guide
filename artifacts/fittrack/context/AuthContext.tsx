import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export type User = {
  id: number;
  phone: string;
  name: string | null;
  credits: number;
};

export type Subscription = {
  plan: string;
  credits_per_month: number;
  expires_at: string | null;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  login: (token: string, user: User, subscription: Subscription | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  useCredit: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  subscription: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  useCredit: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      if (storedToken) {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setToken(storedToken);
          setUser(data.user);
          setSubscription(data.subscription);
        } else {
          await AsyncStorage.removeItem("auth_token");
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function login(t: string, u: User, sub: Subscription | null) {
    await AsyncStorage.setItem("auth_token", t);
    setToken(t);
    setUser(u);
    setSubscription(sub);
  }

  async function logout() {
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setSubscription(null);
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSubscription(data.subscription);
      }
    } catch {}
  }

  async function useCredit(): Promise<boolean> {
    if (!token) return false;
    if (subscription?.plan === "pro") return true;
    try {
      const res = await fetch(`${BASE_URL}/auth/use-credit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, credits: data.credits } : prev);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, subscription, isLoading, login, logout, refreshUser, useCredit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
