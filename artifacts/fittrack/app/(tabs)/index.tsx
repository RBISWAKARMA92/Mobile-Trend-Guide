import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
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
import { useColors } from "@/hooks/useColors";

type Tool = {
  id: string;
  route: string;
  icon: React.ReactNode;
  bg: string;
};

type QuickLink = {
  id: string;
  label: string;
  url: string;
  icon: React.ReactNode;
  color: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, langCode } = useLanguage();

  const tools: Tool[] = [
    {
      id: "calculator",
      route: "/calculator",
      icon: <Feather name="hash" size={26} color="#fff" />,
      bg: "#6366f1",
    },
    {
      id: "converter",
      route: "/converter",
      icon: <Ionicons name="swap-horizontal" size={26} color="#fff" />,
      bg: "#0ea5e9",
    },
    {
      id: "timer",
      route: "/timer",
      icon: <Feather name="clock" size={26} color="#fff" />,
      bg: "#f59e0b",
    },
    {
      id: "notes",
      route: "/notes",
      icon: <Feather name="file-text" size={26} color="#fff" />,
      bg: "#22c55e",
    },
    {
      id: "tip",
      route: "/tip",
      icon: <Ionicons name="cash-outline" size={26} color="#fff" />,
      bg: "#ec4899",
    },
    {
      id: "bmi",
      route: "/bmi",
      icon: <MaterialCommunityIcons name="human" size={26} color="#fff" />,
      bg: "#14b8a6",
    },
    {
      id: "age",
      route: "/age",
      icon: <Ionicons name="calendar-outline" size={26} color="#fff" />,
      bg: "#f97316",
    },
    {
      id: "password",
      route: "/password",
      icon: <Feather name="lock" size={26} color="#fff" />,
      bg: "#8b5cf6",
    },
    {
      id: "reminders",
      route: "/reminders",
      icon: <Ionicons name="alarm-outline" size={26} color="#fff" />,
      bg: "#ef4444",
    },
    {
      id: "chat",
      route: "/chat",
      icon: <Ionicons name="sparkles" size={26} color="#fff" />,
      bg: "#6d28d9",
    },
  ];

  const toolLabels: Record<string, string> = {
    calculator: t.calculator,
    converter: t.converter,
    timer: t.timer,
    notes: t.notes,
    tip: t.tip,
    bmi: t.bmi,
    age: t.age,
    password: t.password,
    reminders: t.reminders ?? "Reminders",
    chat: t.aiChat ?? "AI Friend",
  };

  const quickLinks: QuickLink[] = [
    {
      id: "youtube",
      label: t.youtube ?? "YouTube",
      url: "https://www.youtube.com",
      icon: <Ionicons name="logo-youtube" size={22} color="#fff" />,
      color: "#FF0000",
    },
    {
      id: "google",
      label: t.google ?? "Google",
      url: "https://www.google.com",
      icon: <MaterialCommunityIcons name="google" size={22} color="#fff" />,
      color: "#4285F4",
    },
    {
      id: "gemini",
      label: t.gemini ?? "Gemini",
      url: "https://gemini.google.com",
      icon: <MaterialCommunityIcons name="star-four-points" size={22} color="#fff" />,
      color: "#8B5CF6",
    },
    {
      id: "chatgpt",
      label: t.chatgpt ?? "ChatGPT",
      url: "https://chatgpt.com",
      icon: <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />,
      color: "#10A37F",
    },
    {
      id: "news",
      label: t.news ?? "News",
      url: "https://news.google.com",
      icon: <Ionicons name="newspaper-outline" size={22} color="#fff" />,
      color: "#f59e0b",
    },
  ];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>{t.appName}</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{t.tagline}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/language")}
          style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.langCode, { color: colors.primary }]}>
            {langCode.toUpperCase().slice(0, 3)}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Links */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t.quickLinks ?? "Quick Links"}
        </Text>
        <View style={styles.quickRow}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(link.url);
              }}
              style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.quickIcon, { backgroundColor: link.color }]}>
                {link.icon}
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]} numberOfLines={1}>
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tools */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          {t.tools}
        </Text>
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(tool.route as any);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: tool.bg }]}>
              {tool.icon}
            </View>
            <Text style={[styles.toolName, { color: colors.foreground }]}>
              {toolLabels[tool.id]}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  langCode: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2,
  },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "nowrap" },
  quickCard: {
    flex: 1, alignItems: "center", padding: 10, gap: 6,
    borderRadius: 14, borderWidth: 1, minWidth: 60,
  },
  quickIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  card: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderRadius: 18, borderWidth: 1, gap: 16,
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  toolName: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
