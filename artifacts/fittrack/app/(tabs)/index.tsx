import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
  color: string;
  bg: string;
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
      color: "#6366f1",
      bg: "#6366f1",
    },
    {
      id: "converter",
      route: "/converter",
      icon: <Ionicons name="swap-horizontal" size={26} color="#fff" />,
      color: "#0ea5e9",
      bg: "#0ea5e9",
    },
    {
      id: "timer",
      route: "/timer",
      icon: <Feather name="clock" size={26} color="#fff" />,
      color: "#f59e0b",
      bg: "#f59e0b",
    },
    {
      id: "notes",
      route: "/notes",
      icon: <Feather name="file-text" size={26} color="#fff" />,
      color: "#22c55e",
      bg: "#22c55e",
    },
    {
      id: "tip",
      route: "/tip",
      icon: <Ionicons name="cash-outline" size={26} color="#fff" />,
      color: "#ec4899",
      bg: "#ec4899",
    },
    {
      id: "bmi",
      route: "/bmi",
      icon: <MaterialCommunityIcons name="human" size={26} color="#fff" />,
      color: "#14b8a6",
      bg: "#14b8a6",
    },
    {
      id: "age",
      route: "/age",
      icon: <Ionicons name="calendar-outline" size={26} color="#fff" />,
      color: "#f97316",
      bg: "#f97316",
    },
    {
      id: "password",
      route: "/password",
      icon: <Feather name="lock" size={26} color="#fff" />,
      color: "#8b5cf6",
      bg: "#8b5cf6",
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
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background },
        ]}
      >
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>{t.appName}</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{t.tagline}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/language")}
          style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.langCode, { color: colors.primary }]}>
            {langCode.toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => router.push(tool.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: tool.bg }]}>
              {tool.icon}
            </View>
            <Text style={[styles.toolName, { color: colors.foreground }]}>
              {toolLabels[tool.id]}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.chevron} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langCode: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toolName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  chevron: {
    marginLeft: "auto",
  },
});
