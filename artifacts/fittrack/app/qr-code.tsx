import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { trackToolOpen } from "@/components/InterstitialAdManager";

const PRESETS = [
  { label: "WiFi", emoji: "📶", template: "WIFI:S:MyNetwork;T:WPA;P:MyPassword;;" },
  { label: "URL", emoji: "🔗", template: "https://" },
  { label: "Email", emoji: "📧", template: "mailto:user@example.com" },
  { label: "Phone", emoji: "📞", template: "tel:+91" },
  { label: "WhatsApp", emoji: "💬", template: "https://wa.me/91" },
  { label: "Text", emoji: "📝", template: "" },
];

const SIZES = [160, 200, 240];
const SIZE_LABELS = ["S", "M", "L"];

export default function QRCodeScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [text, setText] = useState("https://dailytools.app");
  const [sizeIdx, setSizeIdx] = useState(1);
  const [fgColor, setFgColor] = useState("#000000");
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState(1);

  const qrSize = SIZES[sizeIdx];

  async function copyText() {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const COLOR_OPTIONS = ["#000000", "#1d4ed8", "#dc2626", "#16a34a", "#7c3aed", "#ea580c"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>QR Generator</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* QR Display */}
        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.qrWrapper, { backgroundColor: "#fff" }]}>
            {text.trim() ? (
              <QRCode
                value={text.trim() || " "}
                size={qrSize}
                color={fgColor}
                backgroundColor="#FFFFFF"
              />
            ) : (
              <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                <Feather name="grid" size={48} color={colors.mutedForeground} />
                <Text style={[styles.qrPlaceholderText, { color: colors.mutedForeground }]}>
                  Enter text below
                </Text>
              </View>
            )}
          </View>

          {/* Size selector */}
          <View style={styles.sizeRow}>
            <Text style={[styles.optLabel, { color: colors.mutedForeground }]}>Size</Text>
            <View style={styles.sizeBtns}>
              {SIZE_LABELS.map((sl, i) => (
                <Pressable
                  key={sl}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSizeIdx(i); }}
                  style={[styles.sizeBtn, { backgroundColor: sizeIdx === i ? colors.primary : colors.muted }]}
                >
                  <Text style={[styles.sizeBtnText, { color: sizeIdx === i ? "#fff" : colors.foreground }]}>{sl}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.optLabel, { color: colors.mutedForeground }]}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFgColor(c); }}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: fgColor === c ? 3 : 1, borderColor: fgColor === c ? colors.primary : "transparent" }]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Presets */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Quick Templates</Text>
        <View style={styles.presetsRow}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={p.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActivePreset(i);
                setText(p.template);
              }}
              style={[styles.presetBtn, { backgroundColor: activePreset === i ? colors.primary : colors.card, borderColor: activePreset === i ? colors.primary : colors.border }]}
            >
              <Text style={styles.presetEmoji}>{p.emoji}</Text>
              <Text style={[styles.presetLabel, { color: activePreset === i ? "#fff" : colors.foreground }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Text input */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Content</Text>
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder="Enter URL, text, WiFi info..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.inputActions}>
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{text.length} chars</Text>
            <Pressable onPress={() => { setText(""); setActivePreset(-1); }} style={styles.clearBtn}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Copy button */}
        <Pressable
          onPress={copyText}
          style={({ pressed }) => [styles.copyBtn, { backgroundColor: copied ? "#22c55e" : colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name={copied ? "check" : "copy"} size={18} color="#fff" />
          <Text style={styles.copyBtnText}>{copied ? "Copied!" : "Copy Content"}</Text>
        </Pressable>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>💡 Tips</Text>
          {[
            "WiFi QR: WIFI:S:NetworkName;T:WPA;P:Password;;",
            "URL QR: Start with https:// for clickable links",
            "Phone QR: Use tel:+91XXXXXXXXXX format",
            "WhatsApp: wa.me/91XXXXXXXXXX opens a direct chat",
          ].map((tip) => (
            <Text key={tip} style={[styles.tipText, { color: colors.mutedForeground }]}>• {tip}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 14 },
  qrCard: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: "center", gap: 16 },
  qrWrapper: { borderRadius: 16, padding: 20, alignItems: "center", justifyContent: "center" },
  qrPlaceholder: { alignItems: "center", justifyContent: "center", gap: 10 },
  qrPlaceholderText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  optLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  sizeBtns: { flexDirection: "row", gap: 8 },
  sizeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sizeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  colorRow: { flexDirection: "row", gap: 8 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  presetEmoji: { fontSize: 16 },
  presetLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  textInput: { fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90, lineHeight: 22 },
  inputActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearBtn: { padding: 4 },
  copyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 20 },
  copyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  tipsCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  tipsTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
