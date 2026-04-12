import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Message = { role: "user" | "assistant"; content: string };

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const SUGGESTIONS_EN = [
  "What is 15% tip on ₹850?",
  "Convert 5 feet to centimeters",
  "How to stay healthy?",
  "What is my BMI if I weigh 70kg and am 175cm?",
];

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, langCode } = useLanguage();
  const { useCredit, user } = useAuth();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speakReplies, setSpeakReplies] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Speech recognition events
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    setInterimText("");
  });
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    if (event.isFinal) {
      setInput((prev) => (prev ? prev + " " + transcript : transcript).trim());
      setInterimText("");
    } else {
      setInterimText(transcript);
    }
  });
  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
    setInterimText("");
  });

  // Pulse animation while listening
  useEffect(() => {
    if (isListening) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [isListening]);

  async function toggleVoice() {
    if (Platform.OS === "web") {
      // Web Speech API fallback
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        return;
      }
    }
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) return;
      ExpoSpeechRecognitionModule.start({
        lang: langCode ?? "en-IN",
        interimResults: true,
        continuous: false,
      });
    } catch {}
  }

  function speakText(text: string) {
    if (!speakReplies) return;
    Speech.stop();
    Speech.speak(text, { language: langCode ?? "en", rate: 0.95 });
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamText]);

  async function sendMessage(userText?: string) {
    const text = (userText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setInterimText("");
    if (isListening) ExpoSpeechRecognitionModule.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const creditOk = await useCredit();
    if (!creditOk) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: "⚡ You've used all your free credits! Upgrade your plan to keep chatting with AI." },
      ]);
      setTimeout(() => router.push("/subscription"), 1500);
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setStreamText("");

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language: langCode }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.done) break;
              if (json.content) {
                fullText += json.content;
                setStreamText(fullText);
              }
            } catch {}
          }
        }
      }

      if (fullText) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
        speakText(fullText);
      }
      setStreamText("");
    } catch {
      const errMsg = "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
      setStreamText("");
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;
  const showInput = (input || interimText).trim();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={[styles.aiDot, { backgroundColor: "#22c55e" }]} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t.aiChat ?? "AI Friend"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Speaker toggle */}
          <Pressable
            onPress={() => {
              setSpeakReplies((v) => !v);
              if (speakReplies) Speech.stop();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.headerBtn, { backgroundColor: speakReplies ? colors.primary + "20" : "transparent" }]}
          >
            <Ionicons
              name={speakReplies ? "volume-high" : "volume-mute-outline"}
              size={18}
              color={speakReplies ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
          {/* Clear */}
          <Pressable onPress={() => { setMessages([]); Speech.stop(); }} style={styles.headerBtn}>
            <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.chatContent, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty && (
          <View style={styles.welcome}>
            <View style={[styles.avatarBig, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              {t.aiWelcomeTitle ?? "Your Smart Friend"}
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
              {t.aiWelcomeSub ?? "Ask me anything — type or tap the mic to speak!"}
            </Text>
            {/* Mic hint */}
            <View style={[styles.micHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="mic" size={16} color={colors.primary} />
              <Text style={[styles.micHintText, { color: colors.mutedForeground }]}>
                Tap the mic button to speak your question
              </Text>
            </View>
            <View style={styles.suggestions}>
              {SUGGESTIONS_EN.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => sendMessage(s)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === "user"
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}
          >
            {msg.role === "assistant" && (
              <View style={[styles.aiAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
              </View>
            )}
            <Text
              style={[
                styles.bubbleText,
                { color: msg.role === "user" ? "#fff" : colors.foreground },
              ]}
            >
              {msg.content}
            </Text>
            {msg.role === "assistant" && (
              <Pressable
                onPress={() => speakText(msg.content)}
                style={styles.speakBtn}
                hitSlop={8}
              >
                <Ionicons name="volume-medium-outline" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        ))}

        {(loading || streamText) && (
          <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.aiAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
            </View>
            {streamText ? (
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>{streamText}</Text>
            ) : (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Interim voice text preview */}
      {isListening && interimText ? (
        <View style={[styles.interimBar, { backgroundColor: colors.primary + "15", borderTopColor: colors.primary + "40" }]}>
          <Ionicons name="mic" size={14} color={colors.primary} />
          <Text style={[styles.interimText, { color: colors.primary }]} numberOfLines={2}>
            {interimText}
          </Text>
        </View>
      ) : null}

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        {/* Mic button */}
        <Pressable onPress={toggleVoice} style={styles.micWrapper}>
          {isListening && (
            <Animated.View
              style={[
                styles.micRipple,
                { backgroundColor: "#ef4444" + "30", transform: [{ scale: pulseAnim }] },
              ]}
            />
          )}
          <View
            style={[
              styles.micBtn,
              { backgroundColor: isListening ? "#ef4444" : colors.card, borderColor: isListening ? "#ef4444" : colors.border },
            ]}
          >
            <Ionicons name={isListening ? "stop" : "mic"} size={20} color={isListening ? "#fff" : colors.primary} />
          </View>
        </Pressable>

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: isListening ? colors.primary + "60" : colors.border, color: colors.foreground },
          ]}
          placeholder={isListening ? "Listening..." : (t.aiPlaceholder ?? "Ask me anything...")}
          placeholderTextColor={isListening ? colors.primary : colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          onSubmitEditing={() => sendMessage()}
          blurOnSubmit={false}
        />

        {/* Send button */}
        <Pressable
          onPress={() => sendMessage()}
          disabled={loading || !showInput}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: showInput && !loading ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={18} color={showInput && !loading ? "#fff" : colors.mutedForeground} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBtn: { padding: 8, borderRadius: 20 },
  chatContent: { padding: 16, gap: 12, flexGrow: 1 },
  welcome: { alignItems: "center", paddingTop: 32, gap: 12 },
  avatarBig: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  welcomeTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  welcomeSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 280 },
  micHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, marginTop: 4,
  },
  micHintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 4 },
  suggestion: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  bubble: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    maxWidth: "85%", padding: 12, borderRadius: 18,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1 },
  aiAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
  },
  bubbleText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  speakBtn: { marginTop: 4, padding: 2 },
  interimBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
  },
  interimText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingTop: 12, gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  micWrapper: {
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
  },
  micRipple: {
    position: "absolute", width: 44, height: 44, borderRadius: 22,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
});
