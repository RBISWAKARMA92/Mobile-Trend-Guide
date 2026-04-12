import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import RewardedAdModal from "@/components/RewardedAdModal";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Plan = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  durationLabel: string;
  credits: number;
  creditsPerMonth: number;
  savings: string | null;
  badge: string | null;
  features: string[];
  color: string;
  popular: boolean;
};

type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
  planName: string;
  priceLabel: string;
};

function buildRazorpayHTML(order: RazorpayOrder, phone: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="background:#000;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<script>
var options = {
  key: "${order.keyId}",
  amount: "${order.amount}",
  currency: "${order.currency}",
  name: "Daily Tools",
  description: "${order.planName} – ${order.priceLabel}",
  order_id: "${order.orderId}",
  prefill: { contact: "${phone}" },
  theme: { color: "#6366f1" },
  handler: function(response) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "PAYMENT_SUCCESS",
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      planId: "${order.planId}"
    }));
  }
};
var rzp = new Razorpay(options);
rzp.on("payment.failed", function(response) {
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: "PAYMENT_FAILED",
    error: response.error.description
  }));
});
rzp.open();
</script>
</body>
</html>`;
}

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, subscription, refreshUser, user, rewardAd, adStatus } = useAuth();
  const [showAdModal, setShowAdModal] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    try {
      const res = await fetch(`${BASE_URL}/subscription/plans`);
      const data = await res.json();
      setPlans(data.plans);
    } catch {}
    setLoading(false);
  }

  async function handleFreePlan() {
    if (!token) { router.push("/login"); return; }
    setActivating("free");
    try {
      const res = await fetch(`${BASE_URL}/subscription/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: "free" }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUser();
        setSuccess("free");
        setTimeout(() => router.replace("/"), 1500);
      }
    } catch {}
    setActivating(null);
  }

  async function handlePaidPlan(planId: string) {
    if (!token) { router.push("/login"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === "web") {
      setActivating(planId);
      const res = await fetch(`${BASE_URL}/subscription/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        await refreshUser();
        setSuccess(planId);
        setTimeout(() => router.replace("/"), 1800);
      }
      setActivating(null);
      return;
    }

    setActivating(planId);
    try {
      const res = await fetch(`${BASE_URL}/subscription/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRazorpayOrder(data);
        setShowWebView(true);
      } else {
        Alert.alert("Error", data.error ?? "Failed to initiate payment");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    }
    setActivating(null);
  }

  async function handleWebViewMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "PAYMENT_SUCCESS") {
        setShowWebView(false);
        setActivating(msg.planId);
        const res = await fetch(`${BASE_URL}/subscription/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            razorpay_order_id: msg.razorpay_order_id,
            razorpay_payment_id: msg.razorpay_payment_id,
            razorpay_signature: msg.razorpay_signature,
            planId: msg.planId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshUser();
          setSuccess(msg.planId);
          setTimeout(() => router.replace("/"), 1800);
        } else {
          Alert.alert("Verification Failed", data.error ?? "Payment could not be verified");
        }
        setActivating(null);
      } else if (msg.type === "PAYMENT_FAILED") {
        setShowWebView(false);
        Alert.alert("Payment Failed", msg.error ?? "Payment was not completed");
      }
    } catch {}
  }

  const currentPlan = subscription?.plan ?? "free";
  const paidPlans = plans.filter((p) => p.id !== "free");
  const freePlan = plans.find((p) => p.id === "free");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Razorpay WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <View style={styles.webViewContainer}>
          <View style={[styles.webViewHeader, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => setShowWebView(false)} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.webViewTitle, { color: colors.foreground }]}>Secure Payment</Text>
            <Ionicons name="shield-checkmark" size={18} color="#22c55e" />
          </View>
          {razorpayOrder && (
            <WebView
              source={{ html: buildRazorpayHTML(razorpayOrder, user?.phone ?? "") }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.replace("/")} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Choose a Plan</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Credits status banner */}
        {user && (
          <View style={[styles.creditsBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <View style={[styles.creditsBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.creditsBadgeText}>
                {user.credits === 9999 ? "∞" : user.credits}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.creditsTitle, { color: colors.foreground }]}>AI Credits Remaining</Text>
              <Text style={[styles.creditsSub, { color: colors.mutedForeground }]}>
                Current plan: <Text style={{ fontFamily: "Inter_700Bold", textTransform: "capitalize", color: colors.primary }}>{currentPlan}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Watch Ad for Credits */}
        {user && subscription?.plan !== "pro" && (
          <View style={[styles.watchAdCard, { backgroundColor: "#f59e0b12", borderColor: "#f59e0b40" }]}>
            <View style={styles.watchAdLeft}>
              <Text style={{ fontSize: 32 }}>📺</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.watchAdTitle, { color: colors.foreground }]}>Free Credits via Ads</Text>
                <Text style={[styles.watchAdSub, { color: colors.mutedForeground }]}>
                  Watch a short ad to earn +10 credits instantly.
                  {adStatus ? ` ${adStatus.remaining_today}/${adStatus.max_per_day} left today.` : ""}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                if ((adStatus?.remaining_today ?? 1) <= 0) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAdModal(true);
              }}
              style={({ pressed }) => [{
                backgroundColor: (adStatus?.remaining_today ?? 1) > 0 ? "#f59e0b" : colors.muted,
                opacity: pressed ? 0.85 : 1,
                paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, alignItems: "center" as const,
              }]}
            >
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: (adStatus?.remaining_today ?? 1) > 0 ? "#fff" : colors.mutedForeground }}>
                {(adStatus?.remaining_today ?? 1) > 0 ? "Watch Ad" : "Limit Reached"}
              </Text>
              {(adStatus?.remaining_today ?? 1) > 0 && (
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>+10 credits</Text>
              )}
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Premium Plans</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          More messages, more savings with longer plans
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Paid plans */}
            {paidPlans.map((plan) => {
              const isActive = currentPlan === plan.id;
              const isSuccess = success === plan.id;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isActive ? plan.color : plan.popular ? plan.color + "60" : colors.border,
                      borderWidth: isActive || plan.popular ? 2 : 1,
                    },
                  ]}
                >
                  {/* Badge */}
                  {(plan.badge || plan.popular) && (
                    <View style={[styles.badge, { backgroundColor: plan.color }]}>
                      <Text style={styles.badgeText}>{plan.badge ?? "Popular"}</Text>
                    </View>
                  )}

                  <View style={styles.planTop}>
                    <View style={[styles.planIconBox, { backgroundColor: plan.color + "18" }]}>
                      <Ionicons
                        name={plan.id === "monthly" ? "calendar-outline" : plan.id === "quarterly" ? "star-outline" : "rocket-outline"}
                        size={22}
                        color={plan.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                      <Text style={[styles.planDuration, { color: colors.mutedForeground }]}>{plan.durationLabel}</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={[styles.planPrice, { color: plan.color }]}>{plan.priceLabel}</Text>
                      {plan.savings && (
                        <View style={[styles.savingsPill, { backgroundColor: "#22c55e18" }]}>
                          <Text style={styles.savingsText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.featuresBlock}>
                    {plan.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={15} color={plan.color} />
                        <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handlePaidPlan(plan.id)}
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
                      <>
                        <Ionicons name="card-outline" size={16} color="#fff" />
                        <Text style={styles.planBtnText}>Subscribe – {plan.priceLabel}</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}

            {/* Free plan — compact */}
            {freePlan && (
              <View style={[styles.freePlanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.freePlanTitle, { color: colors.foreground }]}>Free Plan</Text>
                  <Text style={[styles.freePlanSub, { color: colors.mutedForeground }]}>50 credits · All tools · No payment</Text>
                </View>
                <Pressable
                  onPress={handleFreePlan}
                  disabled={currentPlan === "free" || !!activating || !!success}
                  style={[
                    styles.freePlanBtn,
                    { backgroundColor: currentPlan === "free" || success === "free" ? "#22c55e" : colors.border },
                  ]}
                >
                  {activating === "free" ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.freePlanBtnText, { color: currentPlan === "free" ? "#fff" : colors.foreground }]}>
                      {currentPlan === "free" ? "Active" : "Use Free"}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Payment security note */}
            <View style={[styles.secureRow, { borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#22c55e" />
              <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
                Payments secured by Razorpay · UPI, Cards, NetBanking, Wallets
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <RewardedAdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewarded={async () => { await rewardAd(); }}
        creditsEarned={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webViewContainer: { flex: 1 },
  webViewHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  closeBtn: { padding: 6 },
  webViewTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 14 },
  creditsBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  creditsBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  creditsBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  creditsTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  creditsSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  planCard: { borderRadius: 20, padding: 18, gap: 14, overflow: "hidden" },
  badge: {
    position: "absolute", top: 14, right: 14,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  planTop: { flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 8 },
  planIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  planDuration: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  priceCol: { alignItems: "flex-end", gap: 4 },
  planPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  savingsPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  savingsText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#22c55e" },
  divider: { height: 1, marginHorizontal: -18 },
  featuresBlock: { gap: 7 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  planBtn: { height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  planBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  freePlanCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  freePlanTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  freePlanSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  freePlanBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  freePlanBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  secureRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  secureText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  watchAdCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, gap: 14,
  },
  watchAdLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  watchAdTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  watchAdSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
});
