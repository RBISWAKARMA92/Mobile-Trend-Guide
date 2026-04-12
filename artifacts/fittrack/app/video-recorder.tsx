import { Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function VideoRecorderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const [facing, setFacing] = useState<"front" | "back">("back");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoSaved, setVideoSaved] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: 67 + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.videoRecorder ?? "Video Recorder"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={72} color={colors.mutedForeground} />
          <Text style={[styles.webMsg, { color: colors.foreground }]}>
            {t.cameraWebMsg ?? "Camera is available in the Expo Go app on your phone"}
          </Text>
          <Text style={[styles.webSub, { color: colors.mutedForeground }]}>
            Scan the QR code with Expo Go to use the camera
          </Text>
        </View>
      </View>
    );
  }

  const allGranted = cameraPermission?.granted && micPermission?.granted;

  async function requestAll() {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  async function startRecording() {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    setRecordingDuration(0);
    setVideoSaved(false);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      stopTimer();
      setIsRecording(false);
      if (video?.uri) {
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          setVideoSaved(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      stopTimer();
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    cameraRef.current?.stopRecording();
    stopTimer();
  }

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  if (!allGranted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.videoRecorder ?? "Video Recorder"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={72} color={colors.primary} />
          <Text style={[styles.webMsg, { color: colors.foreground }]}>Camera Permission Required</Text>
          <Pressable onPress={requestAll} style={[styles.permBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      <View style={[styles.camHeader, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.camBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        {isRecording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recTime}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}
        <Pressable onPress={() => setFacing(f => f === "back" ? "front" : "back")} style={styles.camBtn}>
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      {videoSaved && !isRecording && (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <Text style={styles.savedText}>Video saved to Camera Roll!</Text>
        </View>
      )}

      <View style={[styles.camFooter, { paddingBottom: bottomPad + 20 }]}>
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          style={({ pressed }) => [
            styles.recordOuter,
            { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <View style={[styles.recordInner, { backgroundColor: isRecording ? "#ef4444" : "#fff" }]}>
            {isRecording && <View style={styles.stopSquare} />}
          </View>
        </Pressable>
        <Text style={styles.camHint}>
          {isRecording ? "Tap to stop" : "Tap to record"}
        </Text>
      </View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  webMsg: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  webSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  permBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  permBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  camHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  camBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center",
  },
  recIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  recTime: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  savedBadge: {
    position: "absolute", top: "50%", alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  savedText: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  camFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)", paddingTop: 20,
  },
  recordOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  recordInner: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  stopSquare: { width: 26, height: 26, borderRadius: 6, backgroundColor: "#fff" },
  camHint: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
