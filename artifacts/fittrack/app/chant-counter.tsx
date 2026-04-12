import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { trackToolOpen } from "@/components/InterstitialAdManager";
import { useActivity } from "@/context/ActivityContext";
import RewardedAdModal from "@/components/RewardedAdModal";

const SESSIONS_KEY = "@zenspace_chant_sessions";
const GOALS = [7, 11, 21, 33, 54, 108, 500, 1000];

type Session = {
  id: string;
  chantName: string;
  count: number;
  goal: number;
  date: string;
  timestamp: number;
};

const MALA_DOTS = 108;

export default function ChantCounterScreen() {
  const colors = useColors();
  const { subscription, rewardAd } = useAuth();
  const isPro = subscription?.plan === "pro";
  const [showRewardAd, setShowRewardAd] = useState(false);

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logActivity } = useActivity();

  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(108);
  const [chantName, setChantName] = useState("Om Namah Shivaya");
  const [editingName, setEditingName] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionStart] = useState(Date.now());
  const [completions, setCompletions] = useState(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    logActivity("chant-counter", "Chant Counter");
    loadSessions();
  }, []);

  useEffect(() => {
    // Animate ring on count change
    Animated.timing(ringAnim, {
      toValue: (count % goal) / goal,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [count, goal]);

  async function loadSessions() {
    try {
      const raw = await AsyncStorage.getItem(SESSIONS_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch {}
  }

  async function saveSessions(updated: Session[]) {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(0, 30)));
      setSessions(updated.slice(0, 30));
    } catch {}
  }

  function handleTap() {
    const newCount = count + 1;
    setCount(newCount);

    // Haptics
    if (newCount % 10 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation on tap
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, bounciness: 8, useNativeDriver: true }),
    ]).start();

    // Check goal completion
    if (newCount % goal === 0) {
      setCompletions((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      celebrate();
      saveSession(newCount);
      // Offer rewarded ad to free users after completing a mala
      if (!isPro) setTimeout(() => setShowRewardAd(true), 1800);
    }
  }

  function celebrate() {
    celebrateAnim.setValue(0);
    Animated.sequence([
      Animated.timing(celebrateAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(celebrateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  async function saveSession(finalCount: number) {
    const session: Session = {
      id: `${Date.now()}`,
      chantName,
      count: finalCount,
      goal,
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
    };
    const updated = [session, ...sessions];
    await saveSessions(updated);
  }

  function handleReset() {
    if (count > 0) {
      saveSession(count);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCount(0);
  }

  const progress = goal > 0 ? (count % goal) / goal : 0;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Mala dots — 108 dots in a circle, filled based on count % MALA_DOTS
  const filledDots = count % MALA_DOTS;

  const completedSets = Math.floor(count / goal);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          {editingName ? (
            <TextInput
              value={chantName}
              onChangeText={setChantName}
              onBlur={() => setEditingName(false)}
              autoFocus
              style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
              placeholder="Enter chant name…"
              placeholderTextColor={colors.mutedForeground}
              textAlign="center"
            />
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
              <Text style={[styles.chantName, { color: colors.foreground }]} numberOfLines={1}>
                {chantName}
              </Text>
              <Ionicons name="pencil" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Text style={[styles.chantSub, { color: colors.mutedForeground }]}>
            Tap to count • Goal: {goal}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Goal selector */}
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              onPress={() => { setGoal(g); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.goalPill, {
                backgroundColor: goal === g ? colors.primary : colors.card,
                borderColor: goal === g ? colors.primary : colors.border,
              }]}
            >
              <Text style={[styles.goalText, { color: goal === g ? "#fff" : colors.mutedForeground }]}>
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Main circular counter area */}
        <View style={styles.circleArea}>
          {/* Mala dots ring */}
          <View style={styles.malaRing}>
            {Array.from({ length: MALA_DOTS }).map((_, i) => {
              const angle = (i / MALA_DOTS) * 2 * Math.PI - Math.PI / 2;
              const radius = 148;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const filled = i < filledDots;
              return (
                <View
                  key={i}
                  style={[
                    styles.malaDot,
                    {
                      backgroundColor: filled ? colors.primary : colors.border,
                      transform: [{ translateX: x }, { translateY: y }],
                      opacity: filled ? 1 : 0.35,
                      width: i === 0 ? 10 : 6,
                      height: i === 0 ? 10 : 6,
                      borderRadius: 5,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Progress ring (SVG-like using Animated border) */}
          <View style={[styles.progressRingOuter, { borderColor: colors.border }]}>
            <View style={[styles.progressRingInner, {
              backgroundColor: colors.card,
              borderColor: colors.primary,
              borderWidth: 4,
            }]}>
              {/* Completion celebration overlay */}
              <Animated.View style={[styles.celebrateOverlay, {
                opacity: celebrateAnim,
                transform: [{ scale: celebrateAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.1, 1] }) }],
              }]}>
                <Text style={styles.celebrateEmoji}>🎉</Text>
              </Animated.View>

              {/* Count display */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Text style={[styles.countNumber, { color: colors.foreground }]}>
                  {count}
                </Text>
              </Animated.View>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {completedSets > 0 ? `${completedSets}× mala complete` : `of ${goal}`}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressBarFill, {
                    backgroundColor: colors.primary,
                    width: `${Math.min(progress * 100, 100)}%` as any,
                  }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Big tap button */}
        <Pressable
          onPress={handleTap}
          style={({ pressed }) => [styles.tapBtn, {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          }]}
        >
          <Ionicons name="hand-left" size={40} color="#fff" />
          <Text style={styles.tapBtnText}>TAP</Text>
        </Pressable>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Session</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>{completions}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>{goal - (count % goal)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Remaining</Text>
          </View>
        </View>

        {/* Reset button */}
        <Pressable
          onPress={handleReset}
          style={[styles.resetBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Ionicons name="refresh" size={18} color={colors.mutedForeground} />
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Save & Reset</Text>
        </Pressable>

        {/* Session history */}
        {sessions.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>Recent Sessions</Text>
            {sessions.slice(0, 5).map((s) => (
              <View key={s.id} style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.sessionIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={{ fontSize: 18 }}>🙏</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionName, { color: colors.foreground }]}>{s.chantName}</Text>
                  <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>
                    {s.count} chants • Goal {s.goal} • {s.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Rewarded ad after mala completion */}
      <RewardedAdModal
        visible={showRewardAd}
        onClose={() => setShowRewardAd(false)}
        onRewarded={async () => { await rewardAd(); }}
        creditsEarned={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  chantName: { fontSize: 18, fontFamily: "Inter_700Bold", maxWidth: 220 },
  chantSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  nameInput: {
    fontSize: 18, fontFamily: "Inter_700Bold",
    borderBottomWidth: 2, paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 200, textAlign: "center",
  },
  goalRow: {
    flexDirection: "row", gap: 8, paddingHorizontal: 20,
    marginBottom: 24, flexWrap: "wrap",
  },
  goalPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  goalText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  circleArea: {
    alignItems: "center", justifyContent: "center",
    marginBottom: 32, height: 340,
  },
  malaRing: {
    position: "absolute", width: 340, height: 340,
    alignItems: "center", justifyContent: "center",
  },
  malaDot: {
    position: "absolute",
  },
  progressRingOuter: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  progressRingInner: {
    width: 220, height: 220, borderRadius: 110,
    alignItems: "center", justifyContent: "center",
    gap: 4,
  },
  celebrateOverlay: {
    position: "absolute", alignItems: "center", justifyContent: "center",
  },
  celebrateEmoji: { fontSize: 64 },
  countNumber: { fontSize: 72, fontFamily: "Inter_700Bold", lineHeight: 80 },
  countLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressBarContainer: { width: 120, marginTop: 8 },
  progressBarBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: 4, borderRadius: 2 },
  tapBtn: {
    alignSelf: "center", width: 140, height: 140, borderRadius: 70,
    alignItems: "center", justifyContent: "center", gap: 6,
    marginBottom: 24, elevation: 8,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  tapBtnText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  statsRow: {
    flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 16,
  },
  statCard: {
    flex: 1, alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1,
  },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, borderWidth: 1, marginBottom: 24, marginHorizontal: 20,
  },
  resetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  historyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  sessionCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10,
  },
  sessionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sessionName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sessionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
