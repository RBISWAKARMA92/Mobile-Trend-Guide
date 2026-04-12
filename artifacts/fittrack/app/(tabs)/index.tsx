import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";
import RewardedAdModal from "@/components/RewardedAdModal";
import BannerAdView from "@/components/BannerAdView";
import { trackToolOpen } from "@/components/InterstitialAdManager";
import { getComedyLine } from "@/constants/comedyLines";
import { getTodayAffirmation, moodAffirmations } from "@/constants/affirmations";

const MOODS = [
  { emoji: "😄", label: "Great", value: 1 },
  { emoji: "😊", label: "Good", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Down", value: 4 },
  { emoji: "😢", label: "Sad", value: 5 },
];

const FEATURED = [
  {
    id: "chant-counter",
    route: "/chant-counter",
    emoji: "🙏",
    label: "Chant Counter",
    sublabel: "Mala & Rosary",
    colors: ["#7c3aed", "#4f46e5"] as [string, string],
  },
  {
    id: "chat",
    route: "/chat",
    emoji: "🤖",
    label: "AI Friend",
    sublabel: "Chat & Voice",
    colors: ["#0ea5e9", "#6366f1"] as [string, string],
  },
  {
    id: "expense",
    route: "/expense",
    emoji: "💰",
    label: "Expenses",
    sublabel: "Track spending",
    colors: ["#16a34a", "#15803d"] as [string, string],
  },
  {
    id: "notes",
    route: "/notes",
    emoji: "📝",
    label: "Notes",
    sublabel: "Quick notes",
    colors: ["#f59e0b", "#d97706"] as [string, string],
  },
];

type ToolItem = {
  id: string;
  route: string;
  bg: string;
  label: string;
  iconEmoji?: string;
  icon?: string;
  iconLib?: "Feather" | "Ionicons" | "MC";
};

function ToolIcon({ tool }: { tool: ToolItem }) {
  if (tool.iconEmoji) return <Text style={{ fontSize: 20 }}>{tool.iconEmoji}</Text>;
  if (tool.iconLib === "Feather")
    return <Feather name={tool.icon as any} size={20} color="#fff" />;
  if (tool.iconLib === "MC")
    return <MaterialCommunityIcons name={tool.icon as any} size={20} color="#fff" />;
  return <Ionicons name={tool.icon as any} size={20} color="#fff" />;
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, langCode } = useLanguage();
  const { user, subscription, rewardAd, adStatus } = useAuth();
  const { todayMood, setMood } = useActivity();

  const [showAdModal, setShowAdModal] = useState(false);
  const [comedyIdx, setComedyIdx] = useState(() => Math.floor(Math.random() * 7));
  const [moodMsg, setMoodMsg] = useState<string | null>(null);

  const affirmation = getTodayAffirmation();
  const lines = getComedyLine(langCode);
  const joke = lines[comedyIdx % lines.length];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const tools: ToolItem[] = [
    { id: "calculator", route: "/calculator", bg: "#6366f1", label: t.calculator, icon: "hash", iconLib: "Feather" },
    { id: "converter", route: "/converter", bg: "#0ea5e9", label: t.converter, icon: "swap-horizontal", iconLib: "Ionicons" },
    { id: "timer", route: "/timer", bg: "#f59e0b", label: t.timer, icon: "time-outline", iconLib: "Ionicons" },
    { id: "bmi", route: "/bmi", bg: "#14b8a6", label: t.bmi, icon: "human", iconLib: "MC" },
    { id: "age", route: "/age", bg: "#f97316", label: t.age, icon: "calendar-outline", iconLib: "Ionicons" },
    { id: "tip", route: "/tip", bg: "#ec4899", label: t.tip, icon: "cash-outline", iconLib: "Ionicons" },
    { id: "password", route: "/password", bg: "#8b5cf6", label: t.password, icon: "lock-closed-outline", iconLib: "Ionicons" },
    { id: "reminders", route: "/reminders", bg: "#ef4444", label: t.reminders ?? "Reminders", icon: "alarm-outline", iconLib: "Ionicons" },
    { id: "voice-recorder", route: "/voice-recorder", bg: "#dc2626", label: t.voiceRecorder ?? "Voice", icon: "mic", iconLib: "Ionicons" },
    { id: "music", route: "/music", bg: "#059669", label: t.music ?? "Music", icon: "musical-notes", iconLib: "Ionicons" },
    { id: "video-recorder", route: "/video-recorder", bg: "#0284c7", label: t.videoRecorder ?? "Video", icon: "videocam", iconLib: "Ionicons" },
    { id: "kids-zone", route: "/kids-zone", bg: "#f43f5e", label: t.kidsZone ?? "Kids", iconEmoji: "🧒" },
    { id: "flashlight", route: "/flashlight", bg: "#d97706", label: "Flashlight", icon: "flashlight", iconLib: "Ionicons" },
    { id: "world-clock", route: "/world-clock", bg: "#0891b2", label: "World Clock", icon: "earth", iconLib: "Ionicons" },
    { id: "qr-code", route: "/qr-code", bg: "#7c3aed", label: "QR Code", icon: "qr-code", iconLib: "Ionicons" },
  ];

  const quickLinks = [
    { id: "yt", label: "YouTube", url: "https://youtube.com", icon: "logo-youtube", lib: "Ionicons", color: "#FF0000" },
    { id: "g", label: "Google", url: "https://google.com", icon: "google", lib: "MC", color: "#4285F4" },
    { id: "gem", label: "Gemini", url: "https://gemini.google.com", icon: "star-four-points", lib: "MC", color: "#8B5CF6" },
    { id: "gpt", label: "ChatGPT", url: "https://chatgpt.com", icon: "robot-outline", lib: "MC", color: "#10A37F" },
    { id: "news", label: "News", url: "https://news.google.com", icon: "newspaper-outline", lib: "Ionicons", color: "#f59e0b" },
  ];

  function handleMood(val: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMood(val as 1 | 2 | 3 | 4 | 5);
    setMoodMsg(moodAffirmations[val] ?? null);
    setTimeout(() => setMoodMsg(null), 4500);
  }

  function renderQuickIcon(link: typeof quickLinks[0]) {
    if (link.lib === "MC") return <MaterialCommunityIcons name={link.icon as any} size={20} color="#fff" />;
    return <Ionicons name={link.icon as any} size={20} color="#fff" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.zenStar}>✨</Text>
            <Text style={[styles.zenName, { color: colors.foreground }]}>ZenSpace</Text>
          </View>
          <Text style={[styles.greetText, { color: colors.mutedForeground }]}>
            {greetEmoji} {greeting}!
          </Text>
        </View>

        <View style={styles.headerRight}>
          {user ? (
            <>
              {(adStatus === null || (adStatus?.remaining_today ?? 1) > 0) &&
                subscription?.plan !== "pro" && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowAdModal(true);
                    }}
                    style={[styles.adBtn, { backgroundColor: "#f59e0b20", borderColor: "#f59e0b50" }]}
                  >
                    <Text style={{ fontSize: 11 }}>📺</Text>
                    <Text style={[styles.adText, { color: "#f59e0b" }]}>+10</Text>
                  </Pressable>
                )}
              <Pressable
                onPress={() => router.push("/subscription")}
                style={[styles.creditsPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
              >
                <Ionicons name="flash" size={12} color={colors.primary} />
                <Text style={[styles.creditsNum, { color: colors.primary }]}>
                  {user.credits === 9999 ? "∞" : user.credits}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push("/login")}
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person-outline" size={12} color="#fff" />
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/language")}
            style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.langCode, { color: colors.primary }]}>
              {langCode.toUpperCase().slice(0, 3)}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── SCROLL CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        {/* Daily Affirmation Card */}
        <LinearGradient
          colors={[affirmation.color, affirmation.color + "99"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1.2, y: 1 }}
          style={styles.affirmCard}
        >
          <Text style={styles.affirmBadge}>✨ Daily Affirmation</Text>
          <Text style={styles.affirmText}>{affirmation.text}</Text>
        </LinearGradient>

        {/* Comedy Corner */}
        <View style={[styles.jokeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.jokeHeader}>
            <Text style={[styles.jokeBadge, { color: colors.mutedForeground }]}>😄 Today's Smile</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setComedyIdx((i) => i + 1); }}
              style={styles.refreshBtn}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={[styles.jokeText, { color: colors.foreground }]}>{joke}</Text>
        </View>

        {/* Mood Check */}
        <View style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.moodTitle, { color: colors.foreground }]}>How are you today?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => handleMood(m.value)}
                style={[
                  styles.moodBtn,
                  { borderColor: todayMood === m.value ? colors.primary : colors.border },
                  todayMood === m.value && { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLbl, { color: colors.mutedForeground }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {moodMsg ? (
            <Text style={[styles.moodFeedback, { color: colors.primary }]}>{moodMsg}</Text>
          ) : null}
        </View>

        {/* Featured Tools 2×2 */}
        <Text style={[styles.section, { color: colors.mutedForeground }]}>FEATURED TOOLS</Text>
        <View style={styles.featuredGrid}>
          {FEATURED.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                trackToolOpen(subscription?.plan === "pro");
                router.push(f.route as any);
              }}
              style={({ pressed }) => [styles.featCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={f.colors} style={styles.featGrad}>
                <Text style={styles.featEmoji}>{f.emoji}</Text>
                <Text style={styles.featLabel}>{f.label}</Text>
                <Text style={styles.featSub}>{f.sublabel}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* All Tools compact grid */}
        <Text style={[styles.section, { color: colors.mutedForeground }]}>ALL TOOLS</Text>
        <View style={[styles.toolsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                trackToolOpen(subscription?.plan === "pro");
                router.push(tool.route as any);
              }}
              style={({ pressed }) => [styles.toolCell, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: tool.bg }]}>
                <ToolIcon tool={tool} />
              </View>
              <Text style={[styles.toolName, { color: colors.foreground }]} numberOfLines={2}>
                {tool.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={[styles.section, { color: colors.mutedForeground }]}>QUICK LINKS</Text>
        <View style={styles.quickRow}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(link.url); }}
              style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.quickIcon, { backgroundColor: link.color }]}>
                {renderQuickIcon(link)}
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]} numberOfLines={1}>
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Wellness footer */}
        <View style={[styles.wellnessFooter, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 20 }}>🧘</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.wellnessTitle, { color: colors.foreground }]}>Your Wellness, Your Way</Text>
            <Text style={[styles.wellnessSub, { color: colors.mutedForeground }]}>
              ZenSpace is here for you — every day, every mood. 💙
            </Text>
          </View>
        </View>

        {/* Upgrade nudge for free/guest users */}
        {(!user || subscription?.plan === "free" || !subscription) && (
          <Pressable
            onPress={() => router.push("/subscription")}
            style={[styles.upgradeNudge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
          >
            <Ionicons name="flash" size={18} color={colors.primary} />
            <Text style={[styles.upgradeText, { color: colors.primary }]}>
              ⚡ Go Premium — Remove ads & get unlimited AI credits from ₹49/month
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        {/* AdMob Banner — shown to non-pro users only */}
        {subscription?.plan !== "pro" && (
          <View style={styles.bannerWrap}>
            <BannerAdView />
          </View>
        )}
      </ScrollView>

      <RewardedAdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewarded={async () => { await rewardAd(); }}
        creditsEarned={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  zenStar: { fontSize: 20 },
  zenName: { fontSize: 26, fontFamily: "Inter_700Bold" },
  greetText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  adBtn: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  adText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  creditsPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  creditsNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  signInBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  signInText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  langBtn: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  langCode: { fontSize: 12, fontFamily: "Inter_700Bold" },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  // Affirmation
  affirmCard: {
    borderRadius: 20, padding: 20, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  affirmBadge: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ffffff99", letterSpacing: 0.5 },
  affirmText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 26 },

  // Comedy
  jokeCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 8 },
  jokeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  jokeBadge: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4 },
  refreshBtn: { padding: 4 },
  jokeText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },

  // Mood
  moodCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 10 },
  moodTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: {
    flex: 1, alignItems: "center", paddingVertical: 8,
    borderRadius: 14, borderWidth: 1.5, gap: 3,
  },
  moodEmoji: { fontSize: 22 },
  moodLbl: { fontSize: 10, fontFamily: "Inter_400Regular" },
  moodFeedback: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },

  // Section label
  section: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: -4,
  },

  // Featured grid 2×2
  featuredGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  featCard: { width: "48%", borderRadius: 18, overflow: "hidden" },
  featGrad: { padding: 16, gap: 4, minHeight: 110, justifyContent: "flex-end" },
  featEmoji: { fontSize: 28 },
  featLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  featSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#ffffff99" },

  // All Tools grid (4-col)
  toolsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    borderRadius: 20, borderWidth: 1, padding: 8, gap: 0,
  },
  toolCell: {
    width: "25%", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, gap: 6,
  },
  toolIconBox: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  toolName: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },

  // Quick links
  quickRow: { flexDirection: "row", gap: 8 },
  quickCard: {
    flex: 1, alignItems: "center", padding: 10, gap: 5,
    borderRadius: 14, borderWidth: 1,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  // Wellness footer
  wellnessFooter: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  wellnessTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  wellnessSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Upgrade nudge
  upgradeNudge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  upgradeText: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 17 },

  // Banner ad
  bannerWrap: { alignItems: "center", marginTop: 4 },
});
