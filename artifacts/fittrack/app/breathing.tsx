import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { trackToolOpen } from "@/components/InterstitialAdManager";

type Mode = "478" | "box" | "calm";

const MODES: { id: Mode; label: string; emoji: string; desc: string; colors: [string, string] }[] = [
  { id: "478", label: "4-7-8", emoji: "🌙", desc: "Sleep & calm anxiety", colors: ["#4f46e5", "#7c3aed"] },
  { id: "box", label: "Box", emoji: "📦", desc: "Focus & stress relief", colors: ["#0ea5e9", "#0284c7"] },
  { id: "calm", label: "Calm", emoji: "🌊", desc: "Quick relaxation", colors: ["#10b981", "#059669"] },
];

type Phase = { label: string; duration: number; scale: number };

function getPhases(mode: Mode): Phase[] {
  if (mode === "478") return [
    { label: "Inhale", duration: 4, scale: 1.5 },
    { label: "Hold", duration: 7, scale: 1.5 },
    { label: "Exhale", duration: 8, scale: 1.0 },
  ];
  if (mode === "box") return [
    { label: "Inhale", duration: 4, scale: 1.5 },
    { label: "Hold", duration: 4, scale: 1.5 },
    { label: "Exhale", duration: 4, scale: 1.0 },
    { label: "Hold", duration: 4, scale: 1.0 },
  ];
  return [
    { label: "Inhale", duration: 4, scale: 1.5 },
    { label: "Exhale", duration: 6, scale: 1.0 },
  ];
}

export default function BreathingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useAuth();

  useEffect(() => { trackToolOpen(subscription?.plan === "pro"); }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mode, setMode] = useState<Mode>("478");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [totalBreaths, setTotalBreaths] = useState(0);

  const scale = useRef(new Animated.Value(1.0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(0);
  const countRef = useRef(0);

  const currentMode = MODES.find((m) => m.id === mode)!;
  const phases = getPhases(mode);

  const stopSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setPhaseIdx(0);
    setCountdown(0);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const animatePhase = useCallback((phase: Phase) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: phase.scale,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: phase.scale > 1 ? 1 : 0.7,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const startSession = useCallback(() => {
    setRunning(true);
    phaseRef.current = 0;
    countRef.current = phases[0].duration;
    setPhaseIdx(0);
    setCountdown(phases[0].duration);
    animatePhase(phases[0]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    intervalRef.current = setInterval(() => {
      countRef.current -= 1;
      if (countRef.current <= 0) {
        const nextIdx = (phaseRef.current + 1) % phases.length;
        const isNewCycle = nextIdx === 0;
        phaseRef.current = nextIdx;
        countRef.current = phases[nextIdx].duration;
        setPhaseIdx(nextIdx);
        setCountdown(phases[nextIdx].duration);
        animatePhase(phases[nextIdx]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isNewCycle) {
          setTotalBreaths((b) => b + 1);
          if (totalBreaths > 0 && totalBreaths % 5 === 0) {
            setSessions((s) => s + 1);
          }
        }
      } else {
        setCountdown(countRef.current);
      }
    }, 1000);
  }, [phases, animatePhase, totalBreaths]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (running) { stopSession(); }
  }, [mode]);

  const phaseColors: Record<string, string> = {
    Inhale: "#6366f1",
    Hold: "#f59e0b",
    Exhale: "#10b981",
  };
  const currentPhase = phases[phaseIdx];
  const phaseColor = phaseColors[currentPhase?.label] ?? colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[currentMode.colors[0] + "22", colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => { stopSession(); router.back(); }} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Breathing</Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statChip, { color: colors.mutedForeground }]}>
            🌬️ {totalBreaths} breaths
          </Text>
        </View>
      </View>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMode(m.id)}
            style={[
              styles.modeChip,
              {
                backgroundColor: mode === m.id ? m.colors[0] : colors.card,
                borderColor: mode === m.id ? m.colors[0] : colors.border,
              },
            ]}
          >
            <Text style={styles.modeEmoji}>{m.emoji}</Text>
            <Text style={[styles.modeLabel, { color: mode === m.id ? "#fff" : colors.foreground }]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{currentMode.desc}</Text>

      {/* Animated circle */}
      <View style={styles.circleContainer}>
        {/* Outer glow rings */}
        <Animated.View
          style={[
            styles.ring,
            styles.ring3,
            { borderColor: phaseColor + "22", transform: [{ scale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            styles.ring2,
            { borderColor: phaseColor + "44", transform: [{ scale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            styles.ring1,
            { borderColor: phaseColor + "88", transform: [{ scale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: phaseColor, transform: [{ scale }], opacity },
          ]}
        />
        {/* Phase text inside circle */}
        <View style={styles.circleTextBox} pointerEvents="none">
          {running ? (
            <>
              <Text style={styles.phaseLabel}>{currentPhase?.label}</Text>
              <Text style={styles.phaseCountdown}>{countdown}</Text>
            </>
          ) : (
            <Text style={styles.phaseLabel}>Tap Start</Text>
          )}
        </View>
      </View>

      {/* Phase indicators */}
      {running && (
        <View style={styles.phaseRow}>
          {phases.map((p, i) => (
            <View key={i} style={styles.phaseItem}>
              <View
                style={[
                  styles.phaseDot,
                  {
                    backgroundColor: i === phaseIdx ? phaseColors[p.label] : colors.border,
                    width: i === phaseIdx ? 24 : 8,
                  },
                ]}
              />
              <Text style={[styles.phaseName, { color: i === phaseIdx ? phaseColors[p.label] : colors.mutedForeground }]}>
                {p.label} {p.duration}s
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Start / Stop button */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 24 }]}>
        <Pressable
          onPress={running ? stopSession : startSession}
          style={[styles.startBtn, { backgroundColor: running ? "#ef4444" : currentMode.colors[0] }]}
        >
          <Feather name={running ? "square" : "play"} size={22} color="#fff" />
          <Text style={styles.startLabel}>{running ? "Stop" : "Start Session"}</Text>
        </Pressable>

        {/* Technique guide */}
        {!running && (
          <View style={[styles.guide, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>
              {currentMode.emoji} How it works
            </Text>
            {phases.map((p, i) => (
              <Text key={i} style={[styles.guideStep, { color: colors.mutedForeground }]}>
                {i + 1}. {p.label} — {p.duration} seconds
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const CIRCLE = 160;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: { fontSize: 12, fontFamily: "Inter_500Medium" },
  modeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
  },
  modeChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeEmoji: { fontSize: 20, marginBottom: 2 },
  modeLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modeDesc: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  circleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 2,
  },
  ring1: { width: CIRCLE + 40, height: CIRCLE + 40 },
  ring2: { width: CIRCLE + 80, height: CIRCLE + 80 },
  ring3: { width: CIRCLE + 120, height: CIRCLE + 120 },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
  },
  circleTextBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  phaseLabel: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  phaseCountdown: {
    color: "#fff",
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: -4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  phaseItem: { alignItems: "center", gap: 4 },
  phaseDot: { height: 8, borderRadius: 4 },
  phaseName: { fontSize: 11, fontFamily: "Inter_500Medium" },
  footer: { paddingHorizontal: 20 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  startLabel: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  guide: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  guideTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  guideStep: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
