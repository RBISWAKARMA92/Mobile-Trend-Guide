import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

// Web version — pure simulation (AdMob requires native build)
const AD_DURATION = 5;

const AD_CARDS = [
  {
    emoji: "📱",
    brand: "Daily Tools Pro",
    headline: "Unlock Unlimited AI Credits",
    sub: "Upgrade to Pro — only ₹399/year",
    bg: "#6366f1",
  },
  {
    emoji: "🌟",
    brand: "Daily Tools Premium",
    headline: "Get 6000 Credits / Year",
    sub: "Our best value plan. Tap to explore!",
    bg: "#f59e0b",
  },
  {
    emoji: "💬",
    brand: "AI Friend Chat",
    headline: "Talk to AI in 30+ Languages",
    sub: "Voice input · Text-to-speech · Smart answers",
    bg: "#0ea5e9",
  },
  {
    emoji: "🔒",
    brand: "Daily Tools Security",
    headline: "Strong Password Generator",
    sub: "Generate unbreakable passwords instantly",
    bg: "#22c55e",
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onRewarded: () => Promise<void>;
  creditsEarned?: number;
};

export default function RewardedAdModal({ visible, onClose, onRewarded, creditsEarned = 10 }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<"watching" | "success" | "awarding">("watching");
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION);
  const [adCard] = useState(() => AD_CARDS[Math.floor(Math.random() * AD_CARDS.length)]);

  const progress = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const coinFly = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPhase("watching");
    setSecondsLeft(AD_DURATION);
    progress.setValue(0);
    successScale.setValue(0);
    coinFly.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: AD_DURATION * 1000,
      useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handleAdComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible]);

  async function handleAdComplete() {
    setPhase("awarding");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onRewarded();
    setPhase("success");
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, bounciness: 14, useNativeDriver: true }),
      Animated.timing(coinFly, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    setTimeout(() => { onClose(); setPhase("watching"); }, 2400);
  }

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const progressColor = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#ef4444", "#f59e0b", "#22c55e"],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {phase === "watching" && (
            <>
              <View style={styles.sponsoredRow}>
                <View style={[styles.sponsoredBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.sponsoredText, { color: colors.mutedForeground }]}>SPONSORED</Text>
                </View>
                <Text style={[styles.timerText, { color: colors.mutedForeground }]}>{secondsLeft}s</Text>
              </View>

              <View style={[styles.adCard, { backgroundColor: adCard.bg }]}>
                <Text style={styles.adEmoji}>{adCard.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adBrand}>{adCard.brand}</Text>
                  <Text style={styles.adHeadline}>{adCard.headline}</Text>
                  <Text style={styles.adSub}>{adCard.sub}</Text>
                </View>
              </View>

              <View style={[styles.rewardInfo, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
                <Ionicons name="flash" size={18} color={colors.primary} />
                <Text style={[styles.rewardText, { color: colors.primary }]}>
                  Watch to earn <Text style={{ fontFamily: "Inter_700Bold" }}>+{creditsEarned} AI credits</Text>
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth as any, backgroundColor: progressColor as any }]}
                />
              </View>

              <Pressable
                disabled={secondsLeft > 0}
                style={[styles.closeBtn, {
                  backgroundColor: secondsLeft > 0 ? colors.muted : colors.border,
                  opacity: secondsLeft > 0 ? 0.5 : 1,
                }]}
              >
                <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>
                  {secondsLeft > 0 ? `Skip in ${secondsLeft}s` : "Completing…"}
                </Text>
              </Pressable>
            </>
          )}

          {phase === "awarding" && (
            <View style={styles.center}>
              <Ionicons name="flash" size={36} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>Crediting your account…</Text>
            </View>
          )}

          {phase === "success" && (
            <Animated.View style={[styles.center, { transform: [{ scale: successScale }] }]}>
              <Animated.Text
                style={[
                  styles.coinEmoji,
                  {
                    transform: [{ translateY: coinFly.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
                    opacity: coinFly.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
                  },
                ]}
              >
                🪙🪙🪙
              </Animated.Text>
              <View style={[styles.successCircle, { backgroundColor: "#22c55e" }]}>
                <Ionicons name="checkmark" size={52} color="#fff" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>+{creditsEarned} Credits!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Added to your account</Text>
            </Animated.View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  container: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, padding: 24, paddingBottom: 40, gap: 16, minHeight: 340,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 40 },
  loadingText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  sponsoredRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sponsoredBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  sponsoredText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  timerText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  adCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  adEmoji: { fontSize: 44 },
  adBrand: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
  adHeadline: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  adSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 4 },
  rewardInfo: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  rewardText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  closeBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 18 },
  closeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  coinEmoji: { fontSize: 36, marginBottom: 4 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 32, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
