import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LANGUAGES } from "@/constants/translations";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { langCode, setLanguage, t } = useLanguage();
  const router = useRouter();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
    >
      {LANGUAGES.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await setLanguage(lang.code);
            router.back();
          }}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: langCode === lang.code ? `${colors.primary}12` : colors.card,
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
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 18, borderRadius: 16, borderWidth: 1,
  },
  info: { gap: 2 },
  native: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  english: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
