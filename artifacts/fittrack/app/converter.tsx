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

type Category = "length" | "weight" | "temperature" | "volume" | "area" | "speed" | "data" | "energy";

const units: Record<Category, { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]> = {
  length: [
    { label: "m", toBase: (v) => v, fromBase: (v) => v },
    { label: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { label: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { label: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { label: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { label: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { label: "nmi", toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
  ],
  weight: [
    { label: "kg", toBase: (v) => v, fromBase: (v) => v },
    { label: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { label: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { label: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    { label: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "quintal", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
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
    { label: "tbsp", toBase: (v) => v * 0.0147868, fromBase: (v) => v / 0.0147868 },
    { label: "tsp", toBase: (v) => v * 0.00492892, fromBase: (v) => v / 0.00492892 },
  ],
  area: [
    { label: "m²", toBase: (v) => v, fromBase: (v) => v },
    { label: "km²", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { label: "cm²", toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
    { label: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    { label: "in²", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    { label: "acre", toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
    { label: "hectare", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    { label: "sq yd", toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
  ],
  speed: [
    { label: "m/s", toBase: (v) => v, fromBase: (v) => v },
    { label: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { label: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { label: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { label: "knot", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    { label: "Mach", toBase: (v) => v * 343, fromBase: (v) => v / 343 },
  ],
  data: [
    { label: "B", toBase: (v) => v, fromBase: (v) => v },
    { label: "KB", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { label: "MB", toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
    { label: "GB", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
    { label: "TB", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
    { label: "bit", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    { label: "Kbit", toBase: (v) => v * 128, fromBase: (v) => v / 128 },
    { label: "Mbit", toBase: (v) => v * 131072, fromBase: (v) => v / 131072 },
  ],
  energy: [
    { label: "J", toBase: (v) => v, fromBase: (v) => v },
    { label: "kJ", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "cal", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
    { label: "kcal", toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
    { label: "kWh", toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
    { label: "Wh", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { label: "BTU", toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
  ],
};

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "length", label: "Length", emoji: "📏" },
  { id: "weight", label: "Weight", emoji: "⚖️" },
  { id: "temperature", label: "Temp", emoji: "🌡️" },
  { id: "volume", label: "Volume", emoji: "🧪" },
  { id: "area", label: "Area", emoji: "📐" },
  { id: "speed", label: "Speed", emoji: "💨" },
  { id: "data", label: "Data", emoji: "💾" },
  { id: "energy", label: "Energy", emoji: "⚡" },
];

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
    if (!isFinite(out)) return "—";
    return Number.isInteger(out) ? String(out) : out.toPrecision(8).replace(/\.?0+$/, "");
  })();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Category scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => { setCategory(cat.id); setFromIdx(0); setToIdx(1); setInput(""); }}
            style={[
              styles.catBtn,
              {
                backgroundColor: category === cat.id ? colors.primary : colors.card,
                borderColor: category === cat.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catText, { color: category === cat.id ? "#fff" : colors.mutedForeground }]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* From */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.from}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
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
        </ScrollView>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={input}
          onChangeText={setInput}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {/* Arrow */}
      <View style={styles.arrowRow}>
        <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={() => { const tmp = fromIdx; setFromIdx(toIdx); setToIdx(tmp); }}
          style={[styles.swapBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={{ fontSize: 20 }}>⇅</Text>
        </Pressable>
        <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
      </View>

      {/* To */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.to}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
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
        </ScrollView>
        <View style={[styles.resultBox, { borderColor: colors.border }]}>
          <Text style={[styles.resultText, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
            {result || "—"}
          </Text>
          <Text style={[styles.resultUnit, { color: colors.mutedForeground }]}>{catUnits[toIdx].label}</Text>
        </View>
      </View>

      {/* Quick reference */}
      {input !== "" && result !== "" && result !== "—" && (
        <View style={[styles.quickRef, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.quickRefTitle, { color: colors.foreground }]}>📋 Result</Text>
          <Text style={[styles.quickRefText, { color: colors.mutedForeground }]}>
            {input} {catUnits[fromIdx].label} = <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>{result} {catUnits[toIdx].label}</Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  catRow: { gap: 8, paddingVertical: 4 },
  catBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  catEmoji: { fontSize: 15 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  unitRow: { gap: 8, paddingVertical: 2 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  unitText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 20, fontFamily: "Inter_600SemiBold",
  },
  arrowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrowLine: { flex: 1, height: 1 },
  swapBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  resultBox: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  resultText: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700" },
  resultUnit: { fontSize: 14, fontFamily: "Inter_500Medium", marginLeft: 8 },
  quickRef: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  quickRefTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  quickRefText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
