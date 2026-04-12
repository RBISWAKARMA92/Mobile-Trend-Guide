import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

import { getApiBase } from "@/constants/api";
const BASE_URL = getApiBase();
const OTP_LENGTH = 6;

export default function OtpVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { phone, otp: receivedOtp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [isNewUser, setIsNewUser] = useState(false);
  const [success, setSuccess] = useState(false);
  const refs = Array.from({ length: OTP_LENGTH }, () => useRef<TextInput>(null));

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleChange(val: string, idx: number) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && idx < OTP_LENGTH - 1) {
      refs[idx + 1].current?.focus();
    }
    if (next.every((d) => d !== "") && val) {
      verifyOtp(next.join(""));
    }
  }

  function handleKeyPress(key: string, idx: number) {
    if (key === "Backspace" && !otp[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsNewUser(data.isNewUser);
        setSuccess(true);
        await login(data.token, data.user, data.subscription);
        setTimeout(() => {
          if (data.isNewUser) {
            router.replace("/subscription");
          } else {
            router.replace("/");
          }
        }, 1800);
      } else {
        setError(data.error ?? "Invalid OTP");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setOtp(["", "", "", "", "", ""]);
        refs[0].current?.focus();
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
      <View style={[styles.content, { paddingTop: topPad + 40 }]}>
        {success ? (
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: "#22c55e20" }]}>
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {isNewUser ? "Welcome! 🎉" : "Welcome back!"}
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              {isNewUser ? "You received 50 free credits!" : "Logged in successfully"}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.phoneIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Enter OTP</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Sent to {phone}
            </Text>

            {/* Demo OTP display */}
            {receivedOtp ? (
              <View style={[styles.demoBadge, { backgroundColor: "#f59e0b20", borderColor: "#f59e0b40" }]}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={[styles.demoText, { color: "#f59e0b" }]}>
                  Demo OTP: {receivedOtp}
                </Text>
              </View>
            ) : null}

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={refs[idx]}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: digit ? colors.primary : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={digit}
                  onChangeText={(v) => handleChange(v, idx)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={idx === 0}
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={() => verifyOtp(otp.join(""))}
              disabled={loading || otp.some((d) => !d)}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: otp.every((d) => d) ? colors.primary : colors.mutedForeground,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify OTP</Text>}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={resendTimer > 0}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, { color: resendTimer > 0 ? colors.mutedForeground : colors.primary }]}>
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Change number"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, gap: 20, alignItems: "center" },
  phoneIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  demoText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  otpRow: { flexDirection: "row", gap: 10 },
  otpBox: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 2,
    fontSize: 22, fontFamily: "Inter_700Bold",
  },
  error: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_400Regular" },
  btn: { width: "100%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  resendBtn: { paddingVertical: 8 },
  resendText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  successIcon: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
