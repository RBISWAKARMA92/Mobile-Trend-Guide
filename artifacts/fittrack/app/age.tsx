import { Feather } from "@expo/vector-icons";
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

export default function AgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const calc = () => {
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!d || !m || !y || y < 1900) return null;
    const birth = new Date(y, m - 1, d);
    const now = new Date();
    if (birth > now) return null;
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days };
  };

  const result = calc();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.birthdate}</Text>
        <View style={styles.dateRow}>
          {[
            { label: "DD", val: day, set: setDay, max: 2, kbType: "numeric" as const },
            { label: "MM", val: month, set: setMonth, max: 2, kbType: "numeric" as const },
            { label: "YYYY", val: year, set: setYear, max: 4, kbType: "numeric" as const },
          ].map(({ label, val, set, max, kbType }) => (
            <View key={label} style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <TextInput
                style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                keyboardType={kbType}
                value={val}
                onChangeText={set}
                maxLength={max}
                placeholder={label}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          ))}
        </View>
      </View>

      {result && (
        <View style={[styles.result, { backgroundColor: colors.primary }]}>
          <Text style={[styles.resultTitle, { color: "rgba(255,255,255,0.8)" }]}>{t.yourAge}</Text>
          <View style={styles.statRow}>
            <Stat value={result.years} label={t.years} />
            <Stat value={result.months} label={t.months} />
            <Stat value={result.days} label={t.days} />
          </View>
        </View>
      )}

      {!result && (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>{t.birthdate}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dateRow: { flexDirection: "row", gap: 12 },
  dateField: { flex: 1, gap: 6 },
  dateLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  dateInput: {
    borderRadius: 12, borderWidth: 1, paddingVertical: 14,
    textAlign: "center", fontSize: 18, fontFamily: "Inter_600SemiBold",
  },
  result: { borderRadius: 20, padding: 24, gap: 16 },
  resultTitle: { fontSize: 13, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" },
  statRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center", gap: 4 },
  statVal: { fontSize: 52, fontFamily: "Inter_700Bold", color: "#fff", fontWeight: "700" },
  statLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  empty: { borderRadius: 20, borderWidth: 1, padding: 40, alignItems: "center", gap: 12 },
  emptyTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
