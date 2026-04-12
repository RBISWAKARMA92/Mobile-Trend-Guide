import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Recording = {
  id: string;
  uri: string;
  duration: number;
  createdAt: string;
  name: string;
};

const STORAGE_KEY = "voice_recordings";

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function VoiceRecorderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    loadRecordings();
    requestPermissions();
    return () => {
      stopTimer();
      stopCurrentSound();
    };
  }, []);

  async function requestPermissions() {
    if (Platform.OS === "web") { setPermissionGranted(true); return; }
    const { granted } = await Audio.requestPermissionsAsync();
    setPermissionGranted(granted);
    if (granted) {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    }
  }

  async function loadRecordings() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setRecordings(JSON.parse(raw));
  }

  async function saveRecordings(list: Recording[]) {
    setRecordings(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function stopCurrentSound() {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setPlayingId(null);
  }

  async function startRecording() {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Voice recording requires the Expo Go app on a phone.");
      return;
    }
    if (!permissionGranted) { await requestPermissions(); return; }
    try {
      await stopCurrentSound();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTimeRef.current);
      }, 100);
    } catch (e) {
      Alert.alert("Error", "Could not start recording.");
    }
  }

  async function stopRecording() {
    stopTimer();
    setIsRecording(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      recordingRef.current = null;
      if (!uri) return;
      const duration = (status as any).durationMillis ?? recordingDuration;
      const rec: Recording = {
        id: Date.now().toString(),
        uri,
        duration,
        createdAt: new Date().toISOString(),
        name: `Recording ${recordings.length + 1}`,
      };
      await saveRecordings([rec, ...recordings]);
    } catch {}
  }

  async function playRecording(rec: Recording) {
    await stopCurrentSound();
    if (playingId === rec.id) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: rec.uri });
      soundRef.current = sound;
      setPlayingId(rec.id);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if ((s as any).didJustFinish) { setPlayingId(null); }
      });
    } catch {
      Alert.alert("Error", "Could not play this recording.");
      setPlayingId(null);
    }
  }

  async function deleteRecording(id: string) {
    await stopCurrentSound();
    await saveRecordings(recordings.filter((r) => r.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.voiceRecorder ?? "Voice Recorder"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={[styles.recordSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isRecording && (
          <View style={styles.waveRow}>
            {[1, 0.5, 0.9, 0.3, 0.8, 0.6, 1, 0.4, 0.7, 0.5, 0.9].map((h, i) => (
              <View key={i} style={[styles.bar, { backgroundColor: "#ef4444", height: 12 + h * 28, opacity: 0.6 + h * 0.4 }]} />
            ))}
          </View>
        )}
        <Text style={[styles.timerText, { color: isRecording ? "#ef4444" : colors.mutedForeground }]}>
          {isRecording ? formatDuration(recordingDuration) : t.tapToRecord ?? "Tap to Record"}
        </Text>
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          style={({ pressed }) => [
            styles.recordBtn,
            {
              backgroundColor: isRecording ? "#ef4444" : colors.primary,
              transform: [{ scale: pressed ? 0.94 : 1 }],
              shadowColor: isRecording ? "#ef4444" : colors.primary,
              shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
            },
          ]}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={36} color="#fff" />
        </Pressable>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {isRecording ? (t.tapToStop ?? "Tap to stop") : (t.holdToRecord ?? "Tap the mic to start")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {recordings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mic-off-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t.noRecordings ?? "No recordings yet"}
            </Text>
          </View>
        ) : (
          recordings.map((rec) => (
            <View key={rec.id} style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable onPress={() => playRecording(rec)} style={[styles.playBtn, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name={playingId === rec.id ? "pause" : "play"} size={20} color={colors.primary} />
              </Pressable>
              <View style={styles.recInfo}>
                <Text style={[styles.recName, { color: colors.foreground }]}>{rec.name}</Text>
                <Text style={[styles.recMeta, { color: colors.mutedForeground }]}>
                  {formatDuration(rec.duration)} • {formatDate(rec.createdAt)}
                </Text>
                {playingId === rec.id && (
                  <View style={[styles.playingBar, { backgroundColor: colors.primary + "40" }]}>
                    <View style={[styles.playingFill, { backgroundColor: colors.primary }]} />
                  </View>
                )}
              </View>
              <Pressable onPress={() => deleteRecording(rec.id)} style={styles.delBtn}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  recordSection: {
    margin: 16, borderRadius: 24, padding: 32,
    alignItems: "center", gap: 16, borderWidth: 1,
  },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 3, height: 40 },
  bar: { width: 4, borderRadius: 2 },
  timerText: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  recordBtn: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
  },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  recCard: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 16, borderWidth: 1, gap: 12,
  },
  playBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  recInfo: { flex: 1 },
  recName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  recMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  playingBar: { height: 4, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  playingFill: { height: "100%", width: "60%", borderRadius: 2 },
  delBtn: { padding: 6 },
});
