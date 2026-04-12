import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

export default function BMIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  const bmi = h > 0 && w > 0 ? w / (h * h) : null;

  const category = bmi === null ? null
    : bmi < 18.5 ? { label: t.underweight, color: "#3b82f6" }
    : bmi < 25 ? { label: t.normal, color: "#22c55e" }
    : bmi < 30 ? { label: t.overweight, color: "#f59e0b" }
    : { label: t.obese, color: "#ef4444" };

  const pct = bmi ? Math.min(100, (bmi / 40) * 100) : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.height}</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          placeholder="170"
          placeholderTextColor={colors.mutedForeground}
        />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.weight} (kg)</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          placeholder="70"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {bmi !== null && category && (
        <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bmiLabel, { color: colors.mutedForeground }]}>{t.bmiResult}</Text>
          <Text style={[styles.bmiValue, { color: category.color }]}>{bmi.toFixed(1)}</Text>
          <Text style={[styles.catLabel, { color: category.color }]}>{category.label}</Text>

          <View style={[styles.track, { backgroundColor: colors.muted }]}>
            <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: category.color }]} />
          </View>

          <View style={styles.scale}>
            {[
              { label: t.underweight, color: "#3b82f6" },
              { label: t.normal, color: "#22c55e" },
              { label: t.overweight, color: "#f59e0b" },
              { label: t.obese, color: "#ef4444" },
            ].map((c) => (
              <View key={c.label} style={styles.scaleItem}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={[styles.scaleTxt, { color: colors.mutedForeground }]}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontFamily: "Inter_600SemiBold",
  },
  result: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 8 },
  bmiLabel: { fontSize: 13, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 1 },
  bmiValue: { fontSize: 72, fontFamily: "Inter_700Bold", fontWeight: "700", lineHeight: 80 },
  catLabel: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  track: { width: "100%", height: 10, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5 },
  scale: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, justifyContent: "center" },
  scaleItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  scaleTxt: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
