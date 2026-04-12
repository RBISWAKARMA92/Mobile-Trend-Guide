import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { useLanguage } from "@/context/LanguageContext";

type Mode = "stopwatch" | "countdown";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function msToDisplay(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cent = Math.floor((ms % 1000) / 10);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}.${pad(cent)}`;
}

export default function TimerScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [cdH, setCdH] = useState("0");
  const [cdM, setCdM] = useState("5");
  const [cdS, setCdS] = useState("0");
  const [cdTotal, setCdTotal] = useState(0);
  const [cdRemaining, setCdRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const savedRef = useRef<number>(0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startStop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === "stopwatch") {
      if (!running) {
        startRef.current = Date.now() - savedRef.current;
        intervalRef.current = setInterval(() => {
          setElapsed(Date.now() - startRef.current);
        }, 16);
      } else {
        clearInterval(intervalRef.current!);
        savedRef.current = elapsed;
      }
    } else {
      const total = (parseInt(cdH) || 0) * 3600000 + (parseInt(cdM) || 0) * 60000 + (parseInt(cdS) || 0) * 1000;
      if (!running) {
        const rem = cdRemaining > 0 ? cdRemaining : total;
        if (rem <= 0) return;
        setCdTotal(total);
        startRef.current = Date.now() - (total - rem);
        intervalRef.current = setInterval(() => {
          const remaining = total - (Date.now() - startRef.current);
          if (remaining <= 0) {
            setCdRemaining(0);
            clearInterval(intervalRef.current!);
            setRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setCdRemaining(remaining);
          }
        }, 16);
      } else {
        clearInterval(intervalRef.current!);
      }
    }
    setRunning((r) => !r);
  }

  function reset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearInterval(intervalRef.current!);
    setRunning(false);
    setElapsed(0);
    savedRef.current = 0;
    setLaps([]);
    setCdRemaining(0);
  }

  function addLap() {
    if (mode === "stopwatch" && running) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLaps((l) => [elapsed, ...l]);
    }
  }

  const displayTime = mode === "stopwatch" ? msToDisplay(elapsed) : msToDisplay(Math.max(cdRemaining, 0));
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.modeRow}>
        {(["stopwatch", "countdown"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => { reset(); setMode(m); }}
            style={[
              styles.modeBtn,
              { backgroundColor: mode === m ? colors.primary : colors.card, borderColor: mode === m ? colors.primary : colors.border },
            ]}
          >
            <Text style={[styles.modeTxt, { color: mode === m ? "#fff" : colors.mutedForeground }]}>
              {m === "stopwatch" ? t.stopwatch : t.countdown}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.center}>
        <Text style={[styles.time, { color: colors.foreground }]}>{displayTime}</Text>
      </View>

      {mode === "countdown" && !running && cdRemaining === 0 && (
        <View style={styles.cdInputs}>
          {[
            { label: t.hours, val: cdH, set: setCdH },
            { label: t.minutes, val: cdM, set: setCdM },
            { label: t.seconds, val: cdS, set: setCdS },
          ].map(({ label, val, set }) => (
            <View key={label} style={styles.cdField}>
              <TextInput
                style={[styles.cdInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                keyboardType="numeric"
                value={val}
                onChangeText={set}
                maxLength={2}
              />
              <Text style={[styles.cdLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.btnRow}>
        <Pressable onPress={reset} style={[styles.circBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.circTxt, { color: colors.foreground }]}>{t.reset}</Text>
        </Pressable>
        <Pressable onPress={startStop} style={[styles.circBtnLg, { backgroundColor: colors.primary }]}>
          <Text style={[styles.circTxtLg, { color: "#fff" }]}>
            {running ? t.pause : t.start}
          </Text>
        </Pressable>
        {mode === "stopwatch" && (
          <Pressable onPress={addLap} style={[styles.circBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.circTxt, { color: colors.foreground }]}>{t.lap}</Text>
          </Pressable>
        )}
      </View>

      {laps.length > 0 && (
        <ScrollView style={styles.laps} contentContainerStyle={{ paddingBottom: bottomPad + 16 }}>
          {laps.map((l, i) => (
            <View key={i} style={[styles.lapRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.lapNum, { color: colors.mutedForeground }]}>
                {t.lap} {laps.length - i}
              </Text>
              <Text style={[styles.lapTime, { color: colors.foreground }]}>{msToDisplay(l)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center", borderWidth: 1 },
  modeTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  time: { fontSize: 64, fontFamily: "Inter_700Bold", fontWeight: "700", letterSpacing: -2 },
  cdInputs: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24 },
  cdField: { alignItems: "center", gap: 6 },
  cdInput: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, textAlign: "center", fontSize: 22, fontFamily: "Inter_600SemiBold" },
  cdLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  btnRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 24 },
  circBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  circTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  circBtnLg: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  circTxtLg: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  laps: { flex: 1 },
  lapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  lapNum: { fontSize: 14, fontFamily: "Inter_400Regular" },
  lapTime: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
