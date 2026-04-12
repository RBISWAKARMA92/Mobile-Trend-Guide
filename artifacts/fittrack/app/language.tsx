import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LANGUAGES, type Language } from "@/constants/translations";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const INDIAN_CODES = new Set([
  "hi","bn","te","mr","ta","ur","gu","kn","ml","pa","or","as","mai","ne","kok","sd",
]);

const WORLD_LANGS = LANGUAGES.filter((l) => !INDIAN_CODES.has(l.code));
const INDIA_LANGS = LANGUAGES.filter((l) => INDIAN_CODES.has(l.code));

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { langCode, setLanguage, t } = useLanguage();
  const router = useRouter();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const select = async (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLanguage(code);
    router.back();
  };

  const renderLang = (lang: Language) => (
    <Pressable
      key={lang.code}
      onPress={() => select(lang.code)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: langCode === lang.code ? `${colors.primary}14` : colors.card,
          borderColor: langCode === lang.code ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.info}>
        <Text style={[styles.native, { color: colors.foreground }]}>{lang.nativeName}</Text>
        <Text style={[styles.english, { color: colors.mutedForeground }]}>{lang.name}</Text>
      </View>
      {langCode === lang.code && (
        <Feather name="check-circle" size={22} color={colors.primary} />
      )}
    </Pressable>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
    >
      <Text style={[styles.sectionHeader, { color: colors.mutedForeground, borderBottomColor: colors.border }]}>
        🌍  World Languages
      </Text>
      {WORLD_LANGS.map(renderLang)}

      <Text style={[styles.sectionHeader, { color: colors.mutedForeground, borderBottomColor: colors.border, marginTop: 24 }]}>
        🇮🇳  Indian Languages
      </Text>
      {INDIA_LANGS.map(renderLang)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  sectionHeader: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 18, borderRadius: 16, borderWidth: 1,
  },
  info: { gap: 2 },
  native: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  english: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
