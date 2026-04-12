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

const TIP_PRESETS = [10, 15, 18, 20, 25];

export default function TipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [bill, setBill] = useState("");
  const [tip, setTip] = useState(15);
  const [people, setPeople] = useState("2");

  const billVal = parseFloat(bill) || 0;
  const pplVal = Math.max(1, parseInt(people) || 1);
  const tipAmount = billVal * (tip / 100);
  const total = billVal + tipAmount;
  const perPerson = total / pplVal;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.bill}</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={bill}
          onChangeText={setBill}
          placeholder="0.00"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.tipPercent}</Text>
        <View style={styles.presets}>
          {TIP_PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setTip(p)}
              style={[
                styles.preset,
                {
                  backgroundColor: tip === p ? colors.primary : colors.muted,
                  borderColor: tip === p ? colors.primary : "transparent",
                },
              ]}
            >
              <Text style={[styles.presetTxt, { color: tip === p ? "#fff" : colors.foreground }]}>
                {p}%
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.people}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setPeople(String(Math.max(1, pplVal - 1)))}
            style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.stepTxt, { color: colors.foreground }]}>−</Text>
          </Pressable>
          <Text style={[styles.stepVal, { color: colors.foreground }]}>{pplVal}</Text>
          <Pressable
            onPress={() => setPeople(String(pplVal + 1))}
            style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.stepTxt, { color: colors.foreground }]}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.results, { backgroundColor: colors.primary }]}>
        <Row label={t.tipResult} value={`$${tipAmount.toFixed(2)}`} light />
        <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <Row label={t.total} value={`$${total.toFixed(2)}`} light />
        <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <Row label={t.perPerson} value={`$${perPerson.toFixed(2)}`} light big />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, light, big }: { label: string; value: string; light?: boolean; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: light ? "rgba(255,255,255,0.8)" : "#0f172a" }]}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.bigValue, { color: light ? "#fff" : "#0f172a" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 24, fontFamily: "Inter_600SemiBold",
  },
  presets: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  presetTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 20 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  stepTxt: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  stepVal: { fontSize: 22, fontFamily: "Inter_700Bold", minWidth: 40, textAlign: "center" },
  results: { borderRadius: 20, padding: 24, gap: 12 },
  divider: { height: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  rowValue: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  bigValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
});
