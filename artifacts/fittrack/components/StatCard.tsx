import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  accent?: string;
};

export function StatCard({ label, value, unit, icon, accent }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: accent ? `${accent}20` : `${colors.primary}20` }]}>
        {icon}
      </View>
      <View style={styles.info}>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {value}
          {unit && <Text style={[styles.unit, { color: colors.mutedForeground }]}> {unit}</Text>}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
