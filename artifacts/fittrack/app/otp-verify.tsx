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
  const { email, otp: receivedOtp } = useLocalSearchParams<{ email: string; otp: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
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
        body: JSON.stringify({ email, otp: code }),
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
        setError(data.error ?? "Invalid OTP. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setOtp(["", "", "", "", "", ""]);
        refs[0].current?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  async function handleResend() {
    setResendLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendTimer(30);
        setOtp(["", "", "", "", "", ""]);
        refs[0].current?.focus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to resend OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setResendLoading(false);
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
            <View style={[styles.emailIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="mail-unread-outline" size={48} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We sent a 6-digit OTP to
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>

            {receivedOtp ? (
              <View style={[styles.demoBadge, { backgroundColor: "#f59e0b20", borderColor: "#f59e0b40" }]}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={[styles.demoText, { color: "#f59e0b" }]}>
                  Demo OTP: {receivedOtp}
                </Text>
              </View>
            ) : null}

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={refs[idx]}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: error ? "#ef4444" : digit ? colors.primary : colors.border,
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

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

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

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <Pressable onPress={handleResend} disabled={resendLoading}>
                  {resendLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.resendLink, { color: colors.primary }]}>
                      Resend OTP
                    </Text>
                  )}
                </Pressable>
              )}
              <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={[styles.resendLink, { color: colors.mutedForeground }]}>
                  Change email
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, gap: 16, alignItems: "center" },
  emailIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  emailText: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "center" },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  demoText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  otpRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  otpBox: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 2,
    fontSize: 22, fontFamily: "Inter_700Bold",
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  error: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_400Regular" },
  btn: { width: "100%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  resendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resendLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dot: { fontSize: 14 },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  successIcon: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
