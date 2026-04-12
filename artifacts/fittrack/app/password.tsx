import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMS = "0123456789";
const SYMS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

function generate(len: number, upper: boolean, nums: boolean, syms: boolean) {
  let chars = LOWER;
  if (upper) chars += UPPER;
  if (nums) chars += NUMS;
  if (syms) chars += SYMS;
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default function PasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(false);
  const [password, setPassword] = useState(() => generate(16, true, true, false));
  const [copied, setCopied] = useState(false);

  function regen() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPassword(generate(length, upper, nums, syms));
    setCopied(false);
  }

  async function copy() {
    await Clipboard.setStringAsync(password);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
    >
      <View style={[styles.passwordBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.password, { color: colors.primary }]} numberOfLines={2} selectable>
          {password}
        </Text>
        <View style={styles.pwdActions}>
          <Pressable onPress={copy} style={[styles.actionBtn, { backgroundColor: copied ? colors.success + "20" : colors.muted }]}>
            <Feather name={copied ? "check" : "copy"} size={18} color={copied ? colors.success : colors.foreground} />
            <Text style={[styles.actionTxt, { color: copied ? colors.success : colors.foreground }]}>
              {copied ? t.copied : t.copy}
            </Text>
          </Pressable>
          <Pressable onPress={regen} style={[styles.actionBtn, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="refresh-cw" size={18} color={colors.primary} />
            <Text style={[styles.actionTxt, { color: colors.primary }]}>{t.generate}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.settings, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.lengthRow}>
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>{t.passwordLength}</Text>
          <Text style={[styles.lengthVal, { color: colors.primary }]}>{length}</Text>
        </View>
        <View style={styles.sliderRow}>
          {[8, 12, 16, 20, 24, 32].map((l) => (
            <Pressable
              key={l}
              onPress={() => { setLength(l); setPassword(generate(l, upper, nums, syms)); setCopied(false); }}
              style={[
                styles.lenBtn,
                { backgroundColor: length === l ? colors.primary : colors.muted },
              ]}
            >
              <Text style={[styles.lenTxt, { color: length === l ? "#fff" : colors.foreground }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {[
          { label: t.uppercase, val: upper, set: setUpper },
          { label: t.numbers, val: nums, set: setNums },
          { label: t.symbols, val: syms, set: setSyms },
        ].map(({ label, val, set }) => (
          <View key={label} style={[styles.toggle, { borderTopColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
            <Switch
              value={val}
              onValueChange={(v) => {
                set(v);
                setPassword(generate(
                  length,
                  label === t.uppercase ? v : upper,
                  label === t.numbers ? v : nums,
                  label === t.symbols ? v : syms,
                ));
                setCopied(false);
              }}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <Pressable
        onPress={regen}
        style={({ pressed }) => [styles.genBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Feather name="refresh-cw" size={20} color="#fff" />
        <Text style={styles.genTxt}>{t.generate}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  passwordBox: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  password: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: 1, lineHeight: 28 },
  pwdActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  actionTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settings: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  lengthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  lengthVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sliderRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16, flexWrap: "wrap" },
  lenBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  lenTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderTopWidth: 1 },
  genBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 20 },
  genTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
