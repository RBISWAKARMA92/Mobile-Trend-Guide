import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const { width: W } = Dimensions.get("window");

export const ONBOARDING_KEY = "zenspace_seen_onboarding_v1";

const SLIDES = [
  {
    id: "welcome",
    emoji: "✨",
    title: "Welcome to ZenSpace",
    subtitle: "Your smartest daily companion",
    joke: "My doctor said I need more peace. So I downloaded ZenSpace. 😂",
    bg: ["#7c3aed", "#4f46e5"] as [string, string],
    tools: [] as string[],
  },
  {
    id: "tools",
    emoji: "🛠️",
    title: "23+ Tools, One App",
    subtitle: "Everything you need, always ready",
    joke: "",
    bg: ["#0ea5e9", "#6366f1"] as [string, string],
    tools: [
      "🙏 Chant Counter", "🤖 AI Friend", "💰 Expense Tracker",
      "📝 Notes", "⏰ Timer", "🧮 Calculator",
      "🌬️ Breathing", "📹 Video", "🎵 Music",
      "🔔 Reminders", "👤 BMI", "🎂 Age Calculator",
    ],
  },
  {
    id: "pro",
    emoji: "⚡",
    title: "Unlock ZenSpace Pro",
    subtitle: "More AI, more peace",
    joke: "",
    bg: ["#f59e0b", "#ef4444"] as [string, string],
    tools: [] as string[],
    perks: [
      { icon: "zap", text: "500–6000 AI credits/month" },
      { icon: "globe", text: "30+ languages unlocked" },
      { icon: "music", text: "Unlimited YouTube search" },
      { icon: "shield", text: "No ads, ever" },
    ],
    price: "Starting at just ₹49/month",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/");
  }

  function next() {
    if (currentIdx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIdx + 1, animated: true });
    } else {
      finish();
    }
  }

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIdx(viewableItems[0].index);
      }
    }
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
        renderItem={({ item: slide }) => (
          <View style={{ width: W }}>
            <LinearGradient
              colors={slide.bg}
              style={[styles.slideGrad, { paddingTop: topPad + 40 }]}
            >
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSub}>{slide.subtitle}</Text>
              {slide.joke ? (
                <View style={styles.jokeBox}>
                  <Text style={styles.jokeText}>{slide.joke}</Text>
                </View>
              ) : null}
            </LinearGradient>

            {/* Content below gradient */}
            <View style={[styles.slideContent, { backgroundColor: colors.background }]}>
              {slide.tools.length > 0 && (
                <View style={styles.toolsGrid}>
                  {slide.tools.map((t: string) => (
                    <View key={t} style={[styles.toolChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.toolChipText, { color: colors.foreground }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(slide as any).perks && (
                <View style={styles.perksBox}>
                  {(slide as any).perks.map((p: any) => (
                    <View key={p.icon} style={styles.perkRow}>
                      <View style={[styles.perkIcon, { backgroundColor: colors.primary + "22" }]}>
                        <Feather name={p.icon} size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.perkText, { color: colors.foreground }]}>{p.text}</Text>
                    </View>
                  ))}
                  <Text style={[styles.priceTag, { color: colors.primary }]}>
                    {(slide as any).price}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Footer: dots + buttons */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
            const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: colors.primary }]}
              />
            );
          })}
        </View>

        <View style={styles.btnRow}>
          {currentIdx < SLIDES.length - 1 ? (
            <>
              <Pressable onPress={finish} style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
              </Pressable>
              <Pressable onPress={next} style={[styles.nextBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.nextText}>Next</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable onPress={finish} style={[styles.startBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.nextText}>Get Started — It's Free!</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slideGrad: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  slideEmoji: { fontSize: 72, marginBottom: 12 },
  slideTitle: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  slideSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  jokeBox: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  jokeText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    fontStyle: "italic",
  },
  slideContent: { flex: 1, padding: 20 },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  toolChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  toolChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  perksBox: { gap: 12 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  perkText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  priceTag: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 8,
  },
  footer: { paddingHorizontal: 24, gap: 16 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  btnRow: { flexDirection: "row", gap: 12 },
  skipBtn: { paddingHorizontal: 20, paddingVertical: 16, justifyContent: "center" },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
