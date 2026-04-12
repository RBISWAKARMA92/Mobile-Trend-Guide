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

const ZODIAC = [
  { name: "Capricorn", emoji: "♑", from: [12, 22], to: [1, 19] },
  { name: "Aquarius", emoji: "♒", from: [1, 20], to: [2, 18] },
  { name: "Pisces", emoji: "♓", from: [2, 19], to: [3, 20] },
  { name: "Aries", emoji: "♈", from: [3, 21], to: [4, 19] },
  { name: "Taurus", emoji: "♉", from: [4, 20], to: [5, 20] },
  { name: "Gemini", emoji: "♊", from: [5, 21], to: [6, 20] },
  { name: "Cancer", emoji: "♋", from: [6, 21], to: [7, 22] },
  { name: "Leo", emoji: "♌", from: [7, 23], to: [8, 22] },
  { name: "Virgo", emoji: "♍", from: [8, 23], to: [9, 22] },
  { name: "Libra", emoji: "♎", from: [9, 23], to: [10, 22] },
  { name: "Scorpio", emoji: "♏", from: [10, 23], to: [11, 21] },
  { name: "Sagittarius", emoji: "♐", from: [11, 22], to: [12, 21] },
];

function getZodiac(month: number, day: number) {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (month === fm && day >= fd && day <= td) return z;
    } else if (
      (month === fm && day >= fd) ||
      (month === tm && day <= td)
    ) return z;
  }
  return ZODIAC[0];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Next birthday
    const nextBday = new Date(now.getFullYear(), m - 1, d);
    if (nextBday <= now) nextBday.setFullYear(now.getFullYear() + 1);
    const daysUntilBday = Math.ceil((nextBday.getTime() - now.getTime()) / 86400000);

    // Birth weekday
    const birthWeekday = WEEKDAYS[birth.getDay()];

    // Zodiac
    const zodiac = getZodiac(m, d);

    return { years, months, days, totalDays, totalWeeks, totalHours, daysUntilBday, birthWeekday, zodiac, nextBday };
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
            { label: "DD", val: day, set: setDay, max: 2 },
            { label: "MM", val: month, set: setMonth, max: 2 },
            { label: "YYYY", val: year, set: setYear, max: 4 },
          ].map(({ label, val, set, max }) => (
            <View key={label} style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <TextInput
                style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                keyboardType="numeric"
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

      {result ? (
        <>
          {/* Main age result */}
          <View style={[styles.result, { backgroundColor: colors.primary }]}>
            <Text style={[styles.resultTitle, { color: "rgba(255,255,255,0.8)" }]}>{t.yourAge}</Text>
            <View style={styles.statRow}>
              <Stat value={result.years} label={t.years} />
              <Stat value={result.months} label={t.months} />
              <Stat value={result.days} label={t.days} />
            </View>
          </View>

          {/* Fun stats grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statCardEmoji}>📅</Text>
              <Text style={[styles.statCardValue, { color: colors.foreground }]}>{result.totalDays.toLocaleString()}</Text>
              <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Total Days</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statCardEmoji}>📆</Text>
              <Text style={[styles.statCardValue, { color: colors.foreground }]}>{result.totalWeeks.toLocaleString()}</Text>
              <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Total Weeks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statCardEmoji}>⏰</Text>
              <Text style={[styles.statCardValue, { color: colors.foreground }]}>{(result.totalHours / 1000).toFixed(1)}K</Text>
              <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Hours Lived</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statCardEmoji}>🎂</Text>
              <Text style={[styles.statCardValue, { color: colors.foreground }]}>{result.daysUntilBday}</Text>
              <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Days to B'day</Text>
            </View>
          </View>

          {/* Next birthday */}
          <View style={[styles.bdayCard, { backgroundColor: "#ec4899" }]}>
            <Text style={styles.bdayEmoji}>🎂</Text>
            <View>
              <Text style={styles.bdayTitle}>Next Birthday</Text>
              <Text style={styles.bdayDate}>
                {MONTHS_SHORT[result.nextBday.getMonth()]} {result.nextBday.getDate()}, {result.nextBday.getFullYear()}
              </Text>
              <Text style={styles.bdaySub}>
                {result.daysUntilBday === 0 ? "🎉 Today is your birthday!" :
                 result.daysUntilBday === 1 ? "Tomorrow!" :
                 `${result.daysUntilBday} days away`}
              </Text>
            </View>
          </View>

          {/* Zodiac & birth day */}
          <View style={styles.extraRow}>
            <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 32 }}>{result.zodiac.emoji}</Text>
              <Text style={[styles.extraTitle, { color: colors.foreground }]}>{result.zodiac.name}</Text>
              <Text style={[styles.extraSub, { color: colors.mutedForeground }]}>Zodiac Sign</Text>
            </View>
            <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 32 }}>📅</Text>
              <Text style={[styles.extraTitle, { color: colors.foreground }]}>{result.birthWeekday}</Text>
              <Text style={[styles.extraSub, { color: colors.mutedForeground }]}>Born on</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>Enter your birth date above</Text>
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
  container: { padding: 16, gap: 14 },
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statCardEmoji: { fontSize: 24 },
  statCardValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statCardLabel: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  bdayCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  bdayEmoji: { fontSize: 48 },
  bdayTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  bdayDate: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  bdaySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  extraRow: { flexDirection: "row", gap: 10 },
  extraCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: "center", gap: 6 },
  extraTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  extraSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { borderRadius: 20, borderWidth: 1, padding: 40, alignItems: "center", gap: 12 },
  emptyTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
