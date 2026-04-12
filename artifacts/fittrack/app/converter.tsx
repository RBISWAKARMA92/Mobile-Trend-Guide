import React, { useState } from "react";
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
import { useLanguage } from "@/context/LanguageContext";

type Category = "length" | "weight" | "temperature" | "volume";

const units: Record<Category, { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]> = {
  length: [
    { label: "m", toBase: (v) => v, fromBase: (v) => v },
    { label: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { label: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "mi", toBase: (v) => v * 1609.34, fromBase: (v) => v / 1609.34 },
    { label: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { label: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  weight: [
    { label: "kg", toBase: (v) => v, fromBase: (v) => v },
    { label: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { label: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    { label: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  temperature: [
    { label: "°C", toBase: (v) => v, fromBase: (v) => v },
    { label: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { label: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  volume: [
    { label: "L", toBase: (v) => v, fromBase: (v) => v },
    { label: "mL", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    { label: "fl oz", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    { label: "cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
  ],
};

const CATEGORIES: Category[] = ["length", "weight", "temperature", "volume"];

export default function ConverterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [category, setCategory] = useState<Category>("length");
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [input, setInput] = useState("");

  const catUnits = units[category];

  const result = (() => {
    const val = parseFloat(input);
    if (isNaN(val)) return "";
    const base = catUnits[fromIdx].toBase(val);
    const out = catUnits[toIdx].fromBase(base);
    return Number.isInteger(out) ? String(out) : out.toFixed(6).replace(/\.?0+$/, "");
  })();

  const catLabels: Record<Category, string> = {
    length: t.length,
    weight: t.weight,
    temperature: t.temperature,
    volume: t.volume,
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => { setCategory(cat); setFromIdx(0); setToIdx(1); setInput(""); }}
            style={[
              styles.catBtn,
              {
                backgroundColor: category === cat ? colors.primary : colors.card,
                borderColor: category === cat ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.catText, { color: category === cat ? "#fff" : colors.mutedForeground }]}>
              {catLabels[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.from}</Text>
        <View style={styles.unitRow}>
          {catUnits.map((u, i) => (
            <Pressable
              key={u.label}
              onPress={() => setFromIdx(i)}
              style={[
                styles.unitBtn,
                {
                  backgroundColor: fromIdx === i ? `${colors.primary}20` : colors.muted,
                  borderColor: fromIdx === i ? colors.primary : "transparent",
                },
              ]}
            >
              <Text style={[styles.unitText, { color: fromIdx === i ? colors.primary : colors.foreground }]}>
                {u.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={input}
          onChangeText={setInput}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.to}</Text>
        <View style={styles.unitRow}>
          {catUnits.map((u, i) => (
            <Pressable
              key={u.label}
              onPress={() => setToIdx(i)}
              style={[
                styles.unitBtn,
                {
                  backgroundColor: toIdx === i ? `${colors.primary}20` : colors.muted,
                  borderColor: toIdx === i ? colors.primary : "transparent",
                },
              ]}
            >
              <Text style={[styles.unitText, { color: toIdx === i ? colors.primary : colors.foreground }]}>
                {u.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.resultBox, { borderColor: colors.border }]}>
          <Text style={[styles.resultText, { color: colors.primary }]}>{result || "—"}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  unitText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 20, fontFamily: "Inter_600SemiBold",
  },
  resultBox: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16,
    alignItems: "flex-end",
  },
  resultText: { fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
