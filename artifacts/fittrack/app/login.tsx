import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/constants/api";

const BASE_URL = getApiBase();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOTP() {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push({ pathname: "/otp-verify", params: { email: trimmed, otp: data.otp ?? "" } });
      } else {
        setError(data.error ?? "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.content, { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="mail-outline" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to ZenSpace</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your email to get started
        </Text>

        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: error ? "#ef4444" : colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(""); }}
            returnKeyType="send"
            onSubmitEditing={handleSendOTP}
          />
          {isValidEmail(email) && (
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.benefitsTitle, { color: colors.foreground }]}>🎁 Free Welcome Bonus</Text>
          {["50 free AI chat credits", "All 21 tools unlocked", "Voice & video recorder", "AI Talk Mode"].map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSendOTP}
          disabled={loading || !isValidEmail(email)}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: isValidEmail(email) ? colors.primary : colors.mutedForeground,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>

        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace("/"); }}
          style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Continue without account →
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, gap: 16 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 4 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 56, gap: 10,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  error: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_400Regular" },
  benefitsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  benefitsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  btn: {
    height: 56, borderRadius: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  terms: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  guestBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 16 },
  guestText: { fontSize: 14, fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
});
