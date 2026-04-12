import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type WorkoutTemplate = {
  id: string;
  name: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: number;
  exercises: number;
  calories: number;
  color: string;
};

type Props = {
  workout: WorkoutTemplate;
  onPress: () => void;
};

const difficultyColor = {
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
};

export function WorkoutCard({ workout, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: workout.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]}>{workout.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${difficultyColor[workout.difficulty]}20` }]}>
            <Text style={[styles.badgeText, { color: difficultyColor[workout.difficulty] }]}>
              {workout.difficulty}
            </Text>
          </View>
        </View>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{workout.category}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{workout.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{workout.exercises} exercises</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flame-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{workout.calories} cal</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  meta: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
