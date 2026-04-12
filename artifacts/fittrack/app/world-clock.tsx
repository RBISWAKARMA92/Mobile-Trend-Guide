import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type TZEntry = {
  city: string;
  country: string;
  tz: string;
  emoji: string;
  offset: number;
};

const ALL_ZONES: TZEntry[] = [
  { city: "Mumbai", country: "India", tz: "Asia/Kolkata", emoji: "🇮🇳", offset: 5.5 },
  { city: "Delhi", country: "India", tz: "Asia/Kolkata", emoji: "🇮🇳", offset: 5.5 },
  { city: "London", country: "UK", tz: "Europe/London", emoji: "🇬🇧", offset: 0 },
  { city: "New York", country: "USA", tz: "America/New_York", emoji: "🇺🇸", offset: -5 },
  { city: "Los Angeles", country: "USA", tz: "America/Los_Angeles", emoji: "🇺🇸", offset: -8 },
  { city: "Dubai", country: "UAE", tz: "Asia/Dubai", emoji: "🇦🇪", offset: 4 },
  { city: "Singapore", country: "Singapore", tz: "Asia/Singapore", emoji: "🇸🇬", offset: 8 },
  { city: "Tokyo", country: "Japan", tz: "Asia/Tokyo", emoji: "🇯🇵", offset: 9 },
  { city: "Sydney", country: "Australia", tz: "Australia/Sydney", emoji: "🇦🇺", offset: 11 },
  { city: "Paris", country: "France", tz: "Europe/Paris", emoji: "🇫🇷", offset: 1 },
  { city: "Berlin", country: "Germany", tz: "Europe/Berlin", emoji: "🇩🇪", offset: 1 },
  { city: "Toronto", country: "Canada", tz: "America/Toronto", emoji: "🇨🇦", offset: -5 },
  { city: "Beijing", country: "China", tz: "Asia/Shanghai", emoji: "🇨🇳", offset: 8 },
  { city: "Seoul", country: "South Korea", tz: "Asia/Seoul", emoji: "🇰🇷", offset: 9 },
  { city: "Bangkok", country: "Thailand", tz: "Asia/Bangkok", emoji: "🇹🇭", offset: 7 },
  { city: "Karachi", country: "Pakistan", tz: "Asia/Karachi", emoji: "🇵🇰", offset: 5 },
  { city: "Cairo", country: "Egypt", tz: "Africa/Cairo", emoji: "🇪🇬", offset: 2 },
  { city: "Nairobi", country: "Kenya", tz: "Africa/Nairobi", emoji: "🇰🇪", offset: 3 },
  { city: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo", emoji: "🇧🇷", offset: -3 },
  { city: "Mexico City", country: "Mexico", tz: "America/Mexico_City", emoji: "🇲🇽", offset: -6 },
  { city: "Moscow", country: "Russia", tz: "Europe/Moscow", emoji: "🇷🇺", offset: 3 },
  { city: "Istanbul", country: "Turkey", tz: "Europe/Istanbul", emoji: "🇹🇷", offset: 3 },
  { city: "Riyadh", country: "Saudi Arabia", tz: "Asia/Riyadh", emoji: "🇸🇦", offset: 3 },
  { city: "Lahore", country: "Pakistan", tz: "Asia/Karachi", emoji: "🇵🇰", offset: 5 },
  { city: "Dhaka", country: "Bangladesh", tz: "Asia/Dhaka", emoji: "🇧🇩", offset: 6 },
  { city: "Colombo", country: "Sri Lanka", tz: "Asia/Colombo", emoji: "🇱🇰", offset: 5.5 },
  { city: "Kathmandu", country: "Nepal", tz: "Asia/Kathmandu", emoji: "🇳🇵", offset: 5.75 },
  { city: "Kabul", country: "Afghanistan", tz: "Asia/Kabul", emoji: "🇦🇫", offset: 4.5 },
];

const DEFAULT_PINNED = ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Dubai", "Asia/Tokyo"];

function getTimeInTZ(tz: string) {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
  } catch {
    return "--:--:--";
  }
}

function getDateInTZ(tz: string) {
  try {
    return new Date().toLocaleDateString("en-US", {
      timeZone: tz, weekday: "short", month: "short", day: "numeric",
    });
  } catch { return ""; }
}

function isDayTime(tz: string) {
  try {
    const h = parseInt(new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", hour12: false }));
    return h >= 6 && h < 20;
  } catch { return true; }
}

export default function WorldClockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [now, setNow] = useState(new Date());
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED);
  const [showAll, setShowAll] = useState(false);
  const tickAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      Animated.sequence([
        Animated.timing(tickAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(tickAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function togglePin(tz: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinned((p) => p.includes(tz) ? p.filter((x) => x !== tz) : [...p, tz]);
  }

  // Local time
  const localTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const localDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const pinnedZones = ALL_ZONES.filter((z) => pinned.includes(z.tz));
  const unpinnedZones = ALL_ZONES.filter((z) => !pinned.includes(z.tz));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>World Clock</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Local clock */}
        <View style={[styles.localCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.localLabel}>Your Local Time</Text>
          <Animated.Text style={[styles.localTime, { transform: [{ scale: tickAnim }] }]}>
            {localTime}
          </Animated.Text>
          <Text style={styles.localDate}>{localDate}</Text>
        </View>

        {/* Pinned zones */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Pinned Cities</Text>
        {pinnedZones.map((z) => {
          const time = getTimeInTZ(z.tz);
          const date = getDateInTZ(z.tz);
          const isDay = isDayTime(z.tz);
          return (
            <View key={`${z.city}-${z.tz}`} style={[styles.clockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.dayNightIcon, { backgroundColor: isDay ? "#FFF9C4" : "#1a237e20" }]}>
                <Text style={{ fontSize: 22 }}>{isDay ? "☀️" : "🌙"}</Text>
              </View>
              <View style={styles.clockInfo}>
                <View style={styles.clockCityRow}>
                  <Text style={{ fontSize: 18 }}>{z.emoji}</Text>
                  <Text style={[styles.clockCity, { color: colors.foreground }]}>{z.city}</Text>
                  <Text style={[styles.clockCountry, { color: colors.mutedForeground }]}>{z.country}</Text>
                </View>
                <Text style={[styles.clockDate, { color: colors.mutedForeground }]}>{date}</Text>
              </View>
              <View style={styles.clockRight}>
                <Text style={[styles.clockTime, { color: colors.foreground }]}>{time.slice(0, 5)}</Text>
                <Text style={[styles.clockAmPm, { color: colors.primary }]}>{time.slice(-2)}</Text>
              </View>
              <Pressable onPress={() => togglePin(z.tz)} style={styles.pinBtn}>
                <Ionicons name="bookmark" size={20} color={colors.primary} />
              </Pressable>
            </View>
          );
        })}

        {/* Add more zones */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAll((s) => !s); }}
          style={[styles.toggleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name={showAll ? "chevron-up" : "add-circle-outline"} size={20} color={colors.primary} />
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {showAll ? "Hide city list" : "Add more cities"}
          </Text>
        </Pressable>

        {showAll && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>All Cities</Text>
            {unpinnedZones.map((z) => {
              const time = getTimeInTZ(z.tz);
              return (
                <Pressable
                  key={`${z.city}-${z.tz}-all`}
                  onPress={() => togglePin(z.tz)}
                  style={({ pressed }) => [styles.addCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={{ fontSize: 20 }}>{z.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clockCity, { color: colors.foreground }]}>{z.city}, {z.country}</Text>
                  </View>
                  <Text style={[styles.addTime, { color: colors.mutedForeground }]}>{time.slice(0, 5)} {time.slice(-2)}</Text>
                  <Ionicons name="bookmark-outline" size={18} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 12 },
  localCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 4 },
  localLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 },
  localTime: { fontSize: 44, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1 },
  localDate: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  clockCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, padding: 14, gap: 12 },
  dayNightIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  clockInfo: { flex: 1, gap: 3 },
  clockCityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clockCity: { fontSize: 15, fontFamily: "Inter_700Bold" },
  clockCountry: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clockDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clockRight: { alignItems: "flex-end" },
  clockTime: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  clockAmPm: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pinBtn: { padding: 6 },
  toggleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, padding: 14 },
  toggleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  addTime: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
