import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  credits: number;
  features: string[];
  color: string;
  popular: boolean;
};

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, subscription, refreshUser, user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch(`${BASE_URL}/subscription/plans`);
      const data = await res.json();
      setPlans(data.plans);
    } catch {}
    setLoading(false);
  }

  async function activatePlan(planId: string) {
    if (!token) { router.push("/login"); return; }
    setActivating(planId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${BASE_URL}/subscription/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUser();
        setSuccess(planId);
        setTimeout(() => { router.replace("/"); }, 2000);
      }
    } catch {}
    setActivating(null);
  }

  const currentPlan = subscription?.plan ?? "free";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.replace("/")} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Subscription Plans</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Credits banner */}
        {user && (
          <View style={[styles.creditsBanner, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
            <Ionicons name="flash" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.creditsTitle, { color: colors.foreground }]}>
                {user.credits === 9999 ? "Unlimited" : user.credits} AI Credits Remaining
              </Text>
              <Text style={[styles.creditsSub, { color: colors.mutedForeground }]}>
                Current plan: <Text style={{ fontFamily: "Inter_700Bold", textTransform: "capitalize" }}>{currentPlan}</Text>
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose Your Plan</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Upgrade to unlock more AI chat messages every month
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          plans.map((plan) => {
            const isActive = currentPlan === plan.id;
            const isSuccess = success === plan.id;
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActive ? plan.color : colors.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: plan.color + "20" }]}>
                    <Ionicons
                      name={plan.id === "free" ? "gift-outline" : plan.id === "basic" ? "star-outline" : "rocket-outline"}
                      size={24}
                      color={plan.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                    <Text style={[styles.planPrice, { color: plan.color }]}>{plan.priceLabel}</Text>
                  </View>
                  <Text style={[styles.planCredits, { color: colors.mutedForeground }]}>
                    {plan.credits === -1 ? "∞" : plan.credits} credits
                  </Text>
                </View>

                <View style={styles.featuresBlock}>
                  {plan.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => activatePlan(plan.id)}
                  disabled={isActive || !!activating || !!success}
                  style={({ pressed }) => [
                    styles.planBtn,
                    {
                      backgroundColor: isActive || isSuccess ? "#22c55e" : plan.color,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {activating === plan.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : isActive || isSuccess ? (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.planBtnText}>{isSuccess ? "Activated!" : "Current Plan"}</Text>
                    </>
                  ) : (
                    <Text style={styles.planBtnText}>
                      {plan.id === "free" ? "Start Free" : `Subscribe — ${plan.priceLabel}`}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })
        )}

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          * This is a demo. In production, payment would be processed via Razorpay or UPI.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 16 },
  creditsBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  creditsTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  creditsSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  sectionSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 4 },
  planCard: { borderRadius: 20, padding: 20, gap: 16, overflow: "hidden" },
  popularBadge: {
    position: "absolute", top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  popularText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  planPrice: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  planCredits: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  featuresBlock: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  planBtn: { height: 50, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  planBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  note: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
});
