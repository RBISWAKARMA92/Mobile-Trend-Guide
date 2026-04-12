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

export type AdStatus = {
  rewarded_today: number;
  remaining_today: number;
  max_per_day: number;
  credits_per_ad: number;
  current_credits: number;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  adStatus: AdStatus | null;
  login: (token: string, user: User, subscription: Subscription | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  useCredit: () => Promise<boolean>;
  rewardAd: () => Promise<{ success: boolean; credits: number; credits_earned: number; remaining_today: number; error?: string }>;
  fetchAdStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  subscription: null,
  isLoading: true,
  adStatus: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  useCredit: async () => false,
  rewardAd: async () => ({ success: false, credits: 0, credits_earned: 0, remaining_today: 0, error: "Not logged in" }),
  fetchAdStatus: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);

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
          // Load ad status in background
          fetchAdStatusWithToken(storedToken);
        } else {
          await AsyncStorage.removeItem("auth_token");
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function fetchAdStatusWithToken(tok: string) {
    try {
      const res = await fetch(`${BASE_URL}/credits/ad-status`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdStatus(data);
      }
    } catch {}
  }

  async function fetchAdStatus() {
    if (!token) return;
    await fetchAdStatusWithToken(token);
  }

  async function login(t: string, u: User, sub: Subscription | null) {
    await AsyncStorage.setItem("auth_token", t);
    setToken(t);
    setUser(u);
    setSubscription(sub);
    fetchAdStatusWithToken(t);
  }

  async function logout() {
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setSubscription(null);
    setAdStatus(null);
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

  async function rewardAd() {
    if (!token) {
      return { success: false, credits: 0, credits_earned: 0, remaining_today: 0, error: "Not logged in" };
    }
    try {
      const res = await fetch(`${BASE_URL}/credits/reward-ad`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        // Update credits immediately in state
        setUser((prev) => prev ? { ...prev, credits: data.credits } : prev);
        setAdStatus((prev) => prev ? {
          ...prev,
          rewarded_today: data.rewarded_today,
          remaining_today: data.remaining_today,
          current_credits: data.credits,
        } : prev);
        return {
          success: true,
          credits: data.credits,
          credits_earned: data.credits_earned,
          remaining_today: data.remaining_today,
        };
      }
      return { success: false, credits: 0, credits_earned: 0, remaining_today: 0, error: data.error };
    } catch {
      return { success: false, credits: 0, credits_earned: 0, remaining_today: 0, error: "Network error" };
    }
  }

  return (
    <AuthContext.Provider value={{
      token, user, subscription, isLoading, adStatus,
      login, logout, refreshUser, useCredit, rewardAd, fetchAdStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
