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

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOTP() {
    const full = `${countryCode}${phone.replace(/\s/g, "")}`;
    if (phone.length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: full }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push({ pathname: "/otp-verify", params: { phone: full, otp: data.otp } });
      } else {
        setError(data.error ?? "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  const CODES = ["+91", "+1", "+44", "+971", "+61", "+49", "+33", "+81"];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.content, { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 }]}>
        {/* Logo */}
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to Daily Tools</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your mobile number to get started
        </Text>

        {/* Country code selector */}
        <View style={styles.codeRow}>
          {CODES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCountryCode(c)}
              style={[
                styles.codeChip,
                {
                  backgroundColor: countryCode === c ? colors.primary : colors.card,
                  borderColor: countryCode === c ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.codeText, { color: countryCode === c ? "#fff" : colors.foreground }]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {/* Phone input */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.codePrefix, { color: colors.primary }]}>{countryCode}</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Enter phone number"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => { setPhone(v); setError(""); }}
            maxLength={15}
          />
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.benefitsTitle, { color: colors.foreground }]}>🎁 Free Welcome Bonus</Text>
          {["50 free AI chat credits", "All 13 tools unlocked", "Voice & video recorder", "Music player"].map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSendOTP}
          disabled={loading || phone.length < 7}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: phone.length >= 7 ? colors.primary : colors.mutedForeground,
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
  codeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  codeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  codeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 56, gap: 10,
  },
  codePrefix: { fontSize: 17, fontFamily: "Inter_700Bold", minWidth: 40 },
  input: { flex: 1, fontSize: 18, fontFamily: "Inter_400Regular" },
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
});
