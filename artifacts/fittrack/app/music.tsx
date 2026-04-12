import { Feather, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

type Station = {
  id: string;
  name: string;
  genre: string;
  url: string;
  emoji: string;
  color: string;
};

const STATIONS: Station[] = [
  { id: "bollywood", name: "Bollywood Hits", genre: "Hindi", url: "https://streaming.radio.co/s3a7a9c1af/listen", emoji: "🎵", color: "#f59e0b" },
  { id: "jazz", name: "Jazz FM", genre: "Jazz", url: "https://streaming.live365.com/a89006", emoji: "🎷", color: "#8b5cf6" },
  { id: "lofi", name: "Lofi Chill", genre: "Lo-Fi", url: "https://usa9.fastcast4u.com/proxy/jamz?mp=/1", emoji: "🌙", color: "#6366f1" },
  { id: "classical", name: "Classical India", genre: "Classical", url: "https://streams.radiomast.io/ref:ac2bf099-6438-4b3f-9e6a-3c3e22cac5c2", emoji: "🎻", color: "#14b8a6" },
  { id: "pop", name: "Pop Hits", genre: "Pop", url: "https://ais-sa2.cdnstream1.com/1985_128.mp3", emoji: "🎤", color: "#ec4899" },
  { id: "devotional", name: "Devotional", genre: "Spiritual", url: "https://stream.zeno.fm/mhfm3pmm3mhvv", emoji: "🙏", color: "#f97316" },
];

type AppLink = { id: string; name: string; url: string; emoji: string; color: string };

const MUSIC_APPS: AppLink[] = [
  { id: "spotify", name: "Spotify", url: "https://open.spotify.com", emoji: "🎧", color: "#1DB954" },
  { id: "jiosaavn", name: "JioSaavn", url: "https://www.jiosaavn.com", emoji: "🎶", color: "#2BC5B4" },
  { id: "gaana", name: "Gaana", url: "https://gaana.com", emoji: "🎼", color: "#E72744" },
  { id: "ytmusic", name: "YT Music", url: "https://music.youtube.com", emoji: "▶️", color: "#FF0000" },
  { id: "wynk", name: "Wynk Music", url: "https://wynk.in/music", emoji: "🎵", color: "#6C00D5" },
];

export default function MusicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
    return () => { stopSound(); };
  }, []);

  async function stopSound() {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }

  async function playStation(station: Station) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStation?.id === station.id && isPlaying) {
      await stopSound();
      setCurrentStation(null);
      return;
    }
    await stopSound();
    setCurrentStation(station);
    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true, isLooping: false },
        (status) => {
          if ((status as any).isLoaded) {
            setIsPlaying((status as any).isPlaying);
            setIsLoading(false);
          }
          if ((status as any).error) { setIsLoading(false); setIsPlaying(false); }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      setIsLoading(false);
      setCurrentStation(null);
    }
  }

  async function togglePlay() {
    if (!soundRef.current || !currentStation) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.music ?? "Music"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Now Playing */}
        {currentStation && (
          <View style={[styles.nowPlaying, { backgroundColor: currentStation.color + "18", borderColor: currentStation.color + "50" }]}>
            <Text style={[styles.nowPlayingEmoji]}>{currentStation.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nowPlayingLabel, { color: colors.mutedForeground }]}>
                {isLoading ? "Loading..." : (isPlaying ? "Now Playing" : "Paused")}
              </Text>
              <Text style={[styles.nowPlayingName, { color: colors.foreground }]}>{currentStation.name}</Text>
              <Text style={[styles.nowPlayingGenre, { color: colors.mutedForeground }]}>{currentStation.genre}</Text>
            </View>
            <Pressable onPress={togglePlay} style={[styles.playPauseBtn, { backgroundColor: currentStation.color }]}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={stopSound} style={styles.stopBtn}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        {/* Music Apps */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t.musicApps ?? "Music Apps"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsRow}>
          {MUSIC_APPS.map((app) => (
            <Pressable
              key={app.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(app.url); }}
              style={({ pressed }) => [styles.appCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.appEmoji}>{app.emoji}</Text>
              <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Radio Stations */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t.radioStations ?? "Online Radio"}
        </Text>
        {STATIONS.map((station) => {
          const active = currentStation?.id === station.id;
          return (
            <Pressable
              key={station.id}
              onPress={() => playStation(station)}
              style={({ pressed }) => [
                styles.stationCard,
                {
                  backgroundColor: active ? station.color + "14" : colors.card,
                  borderColor: active ? station.color : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.stationIcon, { backgroundColor: station.color + "20" }]}>
                <Text style={styles.stationEmoji}>{station.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stationName, { color: colors.foreground }]}>{station.name}</Text>
                <Text style={[styles.stationGenre, { color: colors.mutedForeground }]}>{station.genre}</Text>
              </View>
              <View style={[styles.playIcon, { backgroundColor: active && isPlaying ? station.color : colors.border }]}>
                <Ionicons
                  name={active && (isPlaying || isLoading) ? (isLoading ? "hourglass-outline" : "pause") : "play"}
                  size={16}
                  color={active && isPlaying ? "#fff" : colors.mutedForeground}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  content: { padding: 16, gap: 12 },
  nowPlaying: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderRadius: 20, borderWidth: 1, gap: 12,
    marginBottom: 4,
  },
  nowPlayingEmoji: { fontSize: 32 },
  nowPlayingLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  nowPlayingName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  nowPlayingGenre: { fontSize: 12, fontFamily: "Inter_400Regular" },
  playPauseBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  stopBtn: { padding: 6 },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  appsRow: { gap: 10, paddingBottom: 4 },
  appCard: {
    alignItems: "center", padding: 14, gap: 6,
    borderRadius: 16, borderWidth: 1, minWidth: 80,
  },
  appEmoji: { fontSize: 28 },
  appName: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  stationCard: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, gap: 14,
  },
  stationIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stationEmoji: { fontSize: 24 },
  stationName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stationGenre: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  playIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
