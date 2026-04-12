import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ─── Alphabet data ────────────────────────────────────────────────────────────
const ALPHABET = [
  { letter: "A", word: "Apple", emoji: "🍎" },
  { letter: "B", word: "Ball", emoji: "⚽" },
  { letter: "C", word: "Cat", emoji: "🐱" },
  { letter: "D", word: "Dog", emoji: "🐶" },
  { letter: "E", word: "Elephant", emoji: "🐘" },
  { letter: "F", word: "Fish", emoji: "🐟" },
  { letter: "G", word: "Grapes", emoji: "🍇" },
  { letter: "H", word: "House", emoji: "🏠" },
  { letter: "I", word: "Ice cream", emoji: "🍦" },
  { letter: "J", word: "Jungle", emoji: "🌴" },
  { letter: "K", word: "Kite", emoji: "🪁" },
  { letter: "L", word: "Lion", emoji: "🦁" },
  { letter: "M", word: "Mango", emoji: "🥭" },
  { letter: "N", word: "Nest", emoji: "🪺" },
  { letter: "O", word: "Orange", emoji: "🍊" },
  { letter: "P", word: "Penguin", emoji: "🐧" },
  { letter: "Q", word: "Queen", emoji: "👑" },
  { letter: "R", word: "Rainbow", emoji: "🌈" },
  { letter: "S", word: "Star", emoji: "⭐" },
  { letter: "T", word: "Tiger", emoji: "🐯" },
  { letter: "U", word: "Umbrella", emoji: "☂️" },
  { letter: "V", word: "Violin", emoji: "🎻" },
  { letter: "W", word: "Whale", emoji: "🐋" },
  { letter: "X", word: "Xylophone", emoji: "🎵" },
  { letter: "Y", word: "Yak", emoji: "🐂" },
  { letter: "Z", word: "Zebra", emoji: "🦓" },
];

// ─── Fun facts for kids ───────────────────────────────────────────────────────
const FUN_FACTS = [
  { fact: "Butterflies taste with their feet! 🦋", emoji: "🦋" },
  { fact: "Elephants are the only animals that can't jump! 🐘", emoji: "🐘" },
  { fact: "A group of flamingos is called a 'flamboyance'! 🦩", emoji: "🦩" },
  { fact: "Octopuses have three hearts! 🐙", emoji: "🐙" },
  { fact: "Snails can sleep for up to 3 years! 🐌", emoji: "🐌" },
  { fact: "A day on Venus is longer than a year on Venus! 🪐", emoji: "🪐" },
  { fact: "Honey never spoils — bees are magic! 🍯", emoji: "🍯" },
  { fact: "Cats have 32 muscles in each ear! 🐱", emoji: "🐱" },
];

// ─── Kids YouTube channels ────────────────────────────────────────────────────
const KIDS_VIDEOS = [
  { label: "Rhymes 🎵", query: "kids nursery rhymes english" },
  { label: "Cartoons 🎨", query: "kids cartoon short stories" },
  { label: "Learn ABC 🔤", query: "learn ABC alphabet kids" },
  { label: "Numbers 🔢", query: "learn numbers 1-100 kids" },
  { label: "Animals 🦁", query: "animals for kids educational" },
  { label: "Science 🔬", query: "fun science experiments for kids" },
  { label: "Yoga 🧘", query: "yoga for kids fun" },
  { label: "Stories 📖", query: "bedtime stories for kids animation" },
];

type Activity = "home" | "math" | "alphabet" | "videos" | "facts" | "story";

function generateMathQ(level: number) {
  const max = level === 1 ? 10 : level === 2 ? 20 : 50;
  const ops = level === 1 ? ["+"] : level === 2 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  if (op === "-" && a < b) [a, b] = [b, a];
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const w = answer + (Math.floor(Math.random() * 9) - 4);
    if (w !== answer && w >= 0) wrongAnswers.add(w);
  }
  const options = [answer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
  return { question: `${a} ${op} ${b} = ?`, answer, options };
}

export default function KidsZoneScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activity, setActivity] = useState<Activity>("home");

  // Math Quiz state
  const [mathLevel, setMathLevel] = useState(1);
  const [question, setQuestion] = useState(() => generateMathQ(1));
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Alphabet state
  const [alphaIdx, setAlphaIdx] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Fun fact state
  const [factIdx, setFactIdx] = useState(0);
  const factAnim = useRef(new Animated.Value(1)).current;

  // YouTube in-app state
  const [ytUrl, setYtUrl] = useState<string | null>(null);

  // AI Story state
  const [storyLoading, setStoryLoading] = useState(false);
  const [story, setStory] = useState("");
  const [storyTheme, setStoryTheme] = useState("a brave bunny");

  const STORY_THEMES = [
    "a brave bunny 🐰",
    "a magical dragon 🐉",
    "a little star ⭐",
    "a friendly elephant 🐘",
    "a space explorer 🚀",
    "an underwater fish 🐟",
  ];

  function playBounce() {
    bounceAnim.setValue(0.8);
    Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, bounciness: 18 }).start();
  }

  function answerQuestion(opt: number) {
    if (selected !== null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(opt);
    setTotalQ((q) => q + 1);
    if (opt === question.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playBounce();
      Speech.speak("Correct! Well done!", { language: "en", rate: 1.1 });
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak(`The answer is ${question.answer}`, { language: "en", rate: 1.0 });
      setStreak(0);
    }
    setTimeout(() => {
      setSelected(null);
      setQuestion(generateMathQ(mathLevel));
    }, 1500);
  }

  function nextLetter(dir: 1 | -1) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (alphaIdx + dir + 26) % 26;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: dir === 1 ? -1 : 1, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setAlphaIdx(next);
    const al = ALPHABET[next];
    Speech.speak(`${al.letter} for ${al.word}`, { language: "en", rate: 0.85 });
  }

  function speakLetter() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const al = ALPHABET[alphaIdx];
    Speech.speak(`${al.letter} for ${al.word}`, { language: "en", rate: 0.85 });
  }

  function nextFact() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(factAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(factAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setFactIdx((i) => (i + 1) % FUN_FACTS.length);
  }

  async function generateStory(theme: string) {
    setStoryLoading(true);
    setStory("");
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write a very short, fun, and safe bedtime story for a child (age 3-8) about ${theme}. Keep it to 4-5 short sentences. Use simple words. Make it warm and happy. End with a positive message.`,
            },
          ],
          language: "en",
        }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) { full += json.content; setStory(full); }
            } catch {}
          }
        }
      }
    } catch { setStory("Once upon a time, there was a happy bunny who loved to play under the sun. 🐰✨"); }
    setStoryLoading(false);
  }

  const al = ALPHABET[alphaIdx];
  const fact = FUN_FACTS[factIdx];

  // ─── Home ─────────────────────────────────────────────────────────────────
  const ACTIVITIES = [
    { id: "math" as Activity, label: "Math Quiz", emoji: "🔢", color: "#f59e0b", desc: "Test your math skills!" },
    { id: "alphabet" as Activity, label: "Alphabet", emoji: "🔤", color: "#6366f1", desc: "Learn A to Z with fun words" },
    { id: "videos" as Activity, label: "Kids Videos", emoji: "📺", color: "#ef4444", desc: "Watch safe learning videos" },
    { id: "facts" as Activity, label: "Fun Facts", emoji: "🌟", color: "#22c55e", desc: "Amazing animal & world facts" },
    { id: "story" as Activity, label: "AI Story", emoji: "📖", color: "#ec4899", desc: "Get a custom bedtime story" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* YouTube Modal */}
      <Modal visible={!!ytUrl} animationType="slide" onRequestClose={() => setYtUrl(null)}>
        <View style={{ flex: 1 }}>
          <View style={[styles.ytHeader, { backgroundColor: "#FF0000", paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => setYtUrl(null)} style={styles.ytClose}>
              <Feather name="x" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.ytTitle}>Kids Safe Videos 📺</Text>
            <View style={{ width: 36 }} />
          </View>
          {ytUrl && (
            <WebView
              source={{ uri: ytUrl }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => {
            if (activity === "home") router.back();
            else setActivity("home");
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🧒</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {activity === "home" ? "Kids Zone" :
             activity === "math" ? "Math Quiz" :
             activity === "alphabet" ? "Learn ABC" :
             activity === "videos" ? "Kids Videos" :
             activity === "facts" ? "Fun Facts" : "AI Story Time"}
          </Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* ── Home ────────────────────────────────────────────────────────────── */}
      {activity === "home" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Welcome Banner */}
          <View style={[styles.welcomeBanner, { backgroundColor: "#6366f1" }]}>
            <Text style={styles.welcomeEmojis}>🌈 ⭐ 🎉 🐘 🦁 🌟</Text>
            <Text style={styles.welcomeTitle}>Hello, Little Explorer!</Text>
            <Text style={styles.welcomeSub}>Choose an activity to start learning & having fun!</Text>
          </View>

          {/* Activity cards in 2-column grid */}
          <View style={styles.grid}>
            {ACTIVITIES.map((act) => (
              <Pressable
                key={act.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setActivity(act.id);
                  if (act.id === "story") generateStory(storyTheme);
                }}
                style={({ pressed }) => [
                  styles.activityCard,
                  { backgroundColor: act.color, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.activityEmoji}>{act.emoji}</Text>
                <Text style={styles.activityLabel}>{act.label}</Text>
                <Text style={styles.activityDesc}>{act.desc}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Math Quiz ───────────────────────────────────────────────────────── */}
      {activity === "math" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Level picker */}
          <View style={styles.levelRow}>
            {[1, 2, 3].map((l) => (
              <Pressable
                key={l}
                onPress={() => { setMathLevel(l); setQuestion(generateMathQ(l)); setSelected(null); }}
                style={[styles.levelBtn, { backgroundColor: mathLevel === l ? "#f59e0b" : colors.card, borderColor: mathLevel === l ? "#f59e0b" : colors.border }]}
              >
                <Text style={[styles.levelBtnText, { color: mathLevel === l ? "#fff" : colors.foreground }]}>
                  {l === 1 ? "Easy ⭐" : l === 2 ? "Medium 🌟" : "Hard 💫"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Score + streak */}
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBadge, { backgroundColor: "#22c55e20", borderColor: "#22c55e" }]}>
              <Text style={[styles.scoreVal, { color: "#22c55e" }]}>✅ {score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Correct</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: "#f59e0b20", borderColor: "#f59e0b" }]}>
              <Text style={[styles.scoreVal, { color: "#f59e0b" }]}>🔥 {streak}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Streak</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: "#6366f120", borderColor: "#6366f1" }]}>
              <Text style={[styles.scoreVal, { color: "#6366f1" }]}>📝 {totalQ}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Total</Text>
            </View>
          </View>

          {/* Question */}
          <Animated.View style={[styles.questionCard, { transform: [{ scale: bounceAnim }] }]}>
            <Text style={styles.questionText}>{question.question}</Text>
          </Animated.View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {question.options.map((opt) => {
              const isCorrect = opt === question.answer;
              const isSelected = opt === selected;
              const bgColor =
                selected === null ? "#6366f1" :
                isCorrect ? "#22c55e" :
                isSelected ? "#ef4444" : "#94a3b8";
              return (
                <Pressable
                  key={opt}
                  onPress={() => answerQuestion(opt)}
                  disabled={selected !== null}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    { backgroundColor: bgColor, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                  {selected !== null && isCorrect && <Text style={styles.optionCheck}>✓</Text>}
                  {selected !== null && isSelected && !isCorrect && <Text style={styles.optionCheck}>✗</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => { setQuestion(generateMathQ(mathLevel)); setSelected(null); }}
            style={[styles.skipBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip →</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── Alphabet ────────────────────────────────────────────────────────── */}
      {activity === "alphabet" && (
        <View style={[styles.alphabetScreen, { paddingBottom: bottomPad + 24 }]}>
          {/* Progress dots */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dotsRow}>
            {ALPHABET.map((a, i) => (
              <Pressable key={a.letter} onPress={() => { setAlphaIdx(i); Speech.speak(`${a.letter} for ${a.word}`, { language: "en", rate: 0.85 }); }}>
                <View style={[styles.dot, { backgroundColor: i === alphaIdx ? "#6366f1" : colors.border }]}>
                  <Text style={[styles.dotText, { color: i === alphaIdx ? "#fff" : colors.mutedForeground }]}>{a.letter}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Main card */}
          <Animated.View style={[
            styles.alphaCard,
            { transform: [{ translateX: slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-40, 0, 40] }) }] },
          ]}>
            <Text style={styles.alphaEmoji}>{al.emoji}</Text>
            <Text style={styles.alphaLetter}>{al.letter}</Text>
            <Text style={styles.alphaWord}>{al.word}</Text>
            <Pressable onPress={speakLetter} style={styles.speakBtn}>
              <Ionicons name="volume-high" size={22} color="#fff" />
              <Text style={styles.speakBtnText}>Hear it!</Text>
            </Pressable>
          </Animated.View>

          {/* Navigation */}
          <View style={styles.alphaNav}>
            <Pressable onPress={() => nextLetter(-1)} style={[styles.navBtn, { backgroundColor: "#6366f1" }]}>
              <Feather name="chevron-left" size={28} color="#fff" />
              <Text style={styles.navBtnText}>Prev</Text>
            </Pressable>
            <Text style={[styles.alphaCounter, { color: colors.mutedForeground }]}>{alphaIdx + 1} / 26</Text>
            <Pressable onPress={() => nextLetter(1)} style={[styles.navBtn, { backgroundColor: "#6366f1" }]}>
              <Text style={styles.navBtnText}>Next</Text>
              <Feather name="chevron-right" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Kids Videos ─────────────────────────────────────────────────────── */}
      {activity === "videos" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.videosNote, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
            <Ionicons name="shield-checkmark" size={18} color="#ef4444" />
            <Text style={[styles.videosNoteText, { color: colors.foreground }]}>
              All videos open safely inside the app. No YouTube account needed!
            </Text>
          </View>
          <View style={styles.videosGrid}>
            {KIDS_VIDEOS.map((v) => (
              <Pressable
                key={v.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setYtUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`);
                }}
                style={({ pressed }) => [
                  styles.videoCard,
                  { backgroundColor: "#ef4444", opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.videoLabel}>{v.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Fun Facts ───────────────────────────────────────────────────────── */}
      {activity === "facts" && (
        <View style={[styles.factsScreen, { paddingBottom: bottomPad + 24 }]}>
          <Animated.View style={[styles.factCard, { opacity: factAnim }]}>
            <Text style={styles.factEmoji}>{fact.emoji}</Text>
            <Text style={styles.factText}>{fact.fact}</Text>
            <Pressable
              onPress={() => Speech.speak(fact.fact.replace(/[🦋🐘🦩🐙🐌🪐🍯🐱]/gu, ""), { language: "en", rate: 0.9 })}
              style={styles.factSpeakBtn}
            >
              <Ionicons name="volume-high" size={18} color="#fff" />
              <Text style={styles.factSpeakText}>Read it!</Text>
            </Pressable>
          </Animated.View>
          <View style={styles.factNav}>
            <Text style={[styles.factCounter, { color: colors.mutedForeground }]}>Fact {factIdx + 1} of {FUN_FACTS.length}</Text>
            <Pressable onPress={nextFact} style={[styles.factNextBtn, { backgroundColor: "#22c55e" }]}>
              <Text style={styles.factNextText}>Next Fact! →</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── AI Story ────────────────────────────────────────────────────────── */}
      {activity === "story" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.storyLabel, { color: colors.mutedForeground }]}>Choose a story theme:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
            {STORY_THEMES.map((theme) => (
              <Pressable
                key={theme}
                onPress={() => { setStoryTheme(theme); generateStory(theme); }}
                style={[
                  styles.themeChip,
                  { backgroundColor: storyTheme === theme ? "#ec4899" : colors.card, borderColor: storyTheme === theme ? "#ec4899" : colors.border },
                ]}
              >
                <Text style={[styles.themeChipText, { color: storyTheme === theme ? "#fff" : colors.foreground }]}>{theme}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.storyBookEmoji}>📖</Text>
            {storyLoading ? (
              <View style={styles.storyLoading}>
                <ActivityIndicator size="large" color="#ec4899" />
                <Text style={[styles.storyLoadingText, { color: colors.mutedForeground }]}>Writing your story…</Text>
              </View>
            ) : story ? (
              <>
                <Text style={[styles.storyText, { color: colors.foreground }]}>{story}</Text>
                <Pressable
                  onPress={() => Speech.speak(story, { language: "en", rate: 0.85 })}
                  style={styles.storyReadBtn}
                >
                  <Ionicons name="volume-high" size={18} color="#fff" />
                  <Text style={styles.storyReadText}>Read Aloud 📢</Text>
                </Pressable>
                <Pressable
                  onPress={() => generateStory(storyTheme)}
                  style={[styles.storyNewBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.storyNewText, { color: colors.mutedForeground }]}>New Story →</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 14 },

  // Welcome
  welcomeBanner: { borderRadius: 20, padding: 20, alignItems: "center", gap: 8 },
  welcomeEmojis: { fontSize: 22 },
  welcomeTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  welcomeSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  activityCard: {
    width: "47.5%", borderRadius: 20, padding: 18, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  activityEmoji: { fontSize: 36 },
  activityLabel: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  activityDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },

  // Math Quiz
  levelRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  levelBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  levelBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  scoreRow: { flexDirection: "row", gap: 10 },
  scoreBadge: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1.5, alignItems: "center", gap: 2 },
  scoreVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  questionCard: {
    backgroundColor: "#f59e0b", borderRadius: 24, padding: 32,
    alignItems: "center", justifyContent: "center", marginVertical: 8,
    shadowColor: "#f59e0b", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  questionText: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff" },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionBtn: {
    width: "47%", height: 72, borderRadius: 20,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  optionText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  optionCheck: { fontSize: 22, color: "#fff" },
  skipBtn: { alignSelf: "center", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginTop: 4 },
  skipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Alphabet
  alphabetScreen: { flex: 1, alignItems: "center", gap: 16, paddingTop: 8 },
  dotsRow: { paddingHorizontal: 16, gap: 6, paddingVertical: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dotText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  alphaCard: {
    backgroundColor: "#6366f1", borderRadius: 30, padding: 36,
    alignItems: "center", gap: 10, width: "80%",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  alphaEmoji: { fontSize: 64 },
  alphaLetter: { fontSize: 72, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 80 },
  alphaWord: { fontSize: 24, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.9)" },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  speakBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  alphaNav: { flexDirection: "row", alignItems: "center", gap: 20 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  navBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  alphaCounter: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Videos
  videosNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  videosNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  videosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  videoCard: { width: "47%", height: 80, borderRadius: 18, alignItems: "center", justifyContent: "center", padding: 12 },
  videoLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },

  // Fun Facts
  factsScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 24 },
  factCard: {
    backgroundColor: "#22c55e", borderRadius: 28, padding: 32,
    alignItems: "center", gap: 16, width: "100%",
    shadowColor: "#22c55e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  factEmoji: { fontSize: 72 },
  factText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", lineHeight: 28 },
  factSpeakBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  factSpeakText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  factNav: { alignItems: "center", gap: 12 },
  factCounter: { fontSize: 14, fontFamily: "Inter_400Regular" },
  factNextBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20 },
  factNextText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },

  // AI Story
  storyLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  themeRow: { gap: 8, paddingVertical: 4 },
  themeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  themeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  storyCard: { borderRadius: 24, padding: 24, borderWidth: 1, gap: 16, alignItems: "center" },
  storyBookEmoji: { fontSize: 48 },
  storyLoading: { alignItems: "center", gap: 12, paddingVertical: 20 },
  storyLoadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  storyText: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 26, textAlign: "center" },
  storyReadBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ec4899", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  storyReadText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  storyNewBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  storyNewText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // YouTube
  ytHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  ytClose: { padding: 6 },
  ytTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
