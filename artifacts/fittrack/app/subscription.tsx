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

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  credits: number;
  features: string[];
  color: string;
  popular: boolean;
  price: number;
};

type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
  planName: string;
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
  description: "${order.planName} Plan – Monthly Subscription",
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
  const { token, subscription, refreshUser, user } = useAuth();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    if (Platform.OS === "web") {
      Alert.alert("Payment", "Razorpay payment works in the Expo Go app on your phone. On web it simulates activation.");
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            <View style={{ width: 36 }} />
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
          Upgrade for more AI chat messages every month
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
                  onPress={() => {
                    if (plan.price === 0) handleFreePlan();
                    else handlePaidPlan(plan.id);
                  }}
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
                      {plan.price > 0 && <Ionicons name="card-outline" size={17} color="#fff" />}
                      <Text style={styles.planBtnText}>
                        {plan.price === 0 ? "Start Free" : `Pay ${plan.priceLabel}`}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            );
          })
        )}

        <View style={[styles.secureRow, { borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
            Payments secured by Razorpay · UPI, Cards, NetBanking supported
          </Text>
        </View>
      </ScrollView>
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
  secureRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  secureText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
});
