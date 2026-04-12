import { Feather, Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

export default function FlashlightScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [torchOn, setTorchOn] = useState(false);
  const [screenLight, setScreenLight] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  function toggleTorch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const next = !torchOn;
    setTorchOn(next);
    Animated.spring(glowAnim, { toValue: next ? 1 : 0, useNativeDriver: false, bounciness: 6 }).start();
  }

  function toggleScreenLight() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScreenLight((s) => !s);
  }

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const glowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });

  // Screen light mode — full bright white screen
  if (screenLight) {
    return (
      <Pressable onPress={toggleScreenLight} style={styles.screenLight}>
        <Text style={styles.screenLightHint}>Tap to turn off</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Hidden camera for torch on native */}
      {Platform.OS !== "web" && (
        <CameraView
          style={{ width: 0, height: 0, position: "absolute" }}
          enableTorch={torchOn}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Flashlight</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={[styles.body, { paddingBottom: bottomPad + 24 }]}>
        {/* Torch toggle */}
        <View style={styles.torchSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            {Platform.OS === "web" ? "Torch (mobile only)" : "Camera Torch"}
          </Text>

          <Animated.View style={[styles.glow, { opacity: glowOpacity, shadowRadius: glowRadius }]} />

          <Pressable
            onPress={toggleTorch}
            disabled={Platform.OS === "web"}
            style={({ pressed }) => [
              styles.torchBtn,
              {
                backgroundColor: torchOn ? "#FFF176" : colors.card,
                borderColor: torchOn ? "#FFD600" : colors.border,
                opacity: Platform.OS === "web" ? 0.4 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Ionicons
              name={torchOn ? "flashlight" : "flashlight-outline"}
              size={64}
              color={torchOn ? "#FF6F00" : colors.mutedForeground}
            />
            <Text style={[styles.torchLabel, { color: torchOn ? "#E65100" : colors.foreground }]}>
              {torchOn ? "ON" : "OFF"}
            </Text>
          </Pressable>

          {Platform.OS === "web" && (
            <Text style={[styles.webNote, { color: colors.mutedForeground }]}>
              Torch requires Expo Go on a physical phone
            </Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Screen light */}
        <View style={styles.screenSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Screen Light</Text>
          <Text style={[styles.screenDesc, { color: colors.mutedForeground }]}>
            Turn your screen into a bright white light — works everywhere
          </Text>
          <Pressable
            onPress={toggleScreenLight}
            style={({ pressed }) => [
              styles.screenBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="sunny" size={28} color="#fff" />
            <Text style={styles.screenBtnText}>Turn On Screen Light</Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "💡", text: "Tap the bulb to toggle camera torch (phone only)" },
            { icon: "☀️", text: "Screen light works on all devices including web" },
            { icon: "👆", text: "Tap anywhere to turn off screen light" },
          ].map((tip) => (
            <View key={tip.text} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  body: { flex: 1, paddingHorizontal: 20, gap: 28 },
  torchSection: { alignItems: "center", gap: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1 },
  glow: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#FFD600",
    shadowColor: "#FFD600", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 80, elevation: 20,
  },
  torchBtn: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 2,
    alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#FFD600", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  torchLabel: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  webNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: -8 },
  divider: { height: 1 },
  screenSection: { alignItems: "center", gap: 10 },
  screenDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  screenBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20,
  },
  screenBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  tipsCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  screenLight: {
    flex: 1, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "flex-end", paddingBottom: 60,
  },
  screenLightHint: { fontSize: 14, color: "rgba(0,0,0,0.2)", fontFamily: "Inter_400Regular" },
});
