import { Feather, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
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
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Station = { id: string; name: string; genre: string; url: string; emoji: string; color: string };
type LocalTrack = { id: string; name: string; uri: string; size?: number };
type PlayingSource = "radio" | "local" | "spotify";
type SpotifyTrack = {
  id: string; name: string; artists: string; album: string;
  image: string | null; preview_url: string | null; spotify_url: string | null; duration_ms: number;
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

const TABS = ["Spotify", "Phone", "Radio", "Apps"] as const;
type Tab = (typeof TABS)[number];

export default function MusicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<Tab>("Spotify");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [source, setSource] = useState<PlayingSource>("local");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const marqueAnim = useRef(new Animated.Value(0)).current;

  // Spotify state
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
    return () => { stopSound(); };
  }, []);

  // Marquee for long song names
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(marqueAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(marqueAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [currentId]);

  // Load featured Spotify tracks when tab opens
  useEffect(() => {
    if (tab === "Spotify" && spotifyResults.length === 0) {
      fetchFeatured();
    }
  }, [tab]);

  async function fetchFeatured() {
    setSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const r = await fetch(`${API_BASE}/spotify/featured`);
      const data = await r.json();
      if (data.tracks) setSpotifyResults(data.tracks);
      else setSpotifyError("Could not load tracks");
    } catch {
      setSpotifyError("Network error. Check connection.");
    } finally {
      setSpotifyLoading(false);
    }
  }

  async function searchSpotify(q: string) {
    if (!q.trim()) { fetchFeatured(); return; }
    setSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const r = await fetch(`${API_BASE}/spotify/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (data.tracks) setSpotifyResults(data.tracks);
      else setSpotifyError(data.error ?? "No results");
    } catch {
      setSpotifyError("Network error. Check connection.");
    } finally {
      setSpotifyLoading(false);
    }
  }

  function formatMs(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  async function stopSound() {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setPosition(0);
    setDuration(0);
  }

  function onPlaybackStatus(status: any) {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setIsLoading(false);
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setCurrentId(null);
    }
  }

  async function playUri(id: string, uri: string, src: PlayingSource) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentId === id && isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (currentId === id && !isPlaying) {
      await soundRef.current?.playAsync();
      setIsPlaying(true);
      return;
    }
    await stopSound();
    setCurrentId(id);
    setSource(src);
    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatus
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      setIsLoading(false);
      setCurrentId(null);
    }
  }

  async function pickLocalMusic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const newTracks: LocalTrack[] = result.assets.map((a) => ({
        id: a.uri,
        name: a.name.replace(/\.[^.]+$/, ""),
        uri: a.uri,
        size: a.size,
      }));
      setLocalTracks((prev) => {
        const existing = new Set(prev.map((t) => t.uri));
        return [...prev, ...newTracks.filter((t) => !existing.has(t.uri))];
      });
    } catch {}
  }

  function removeTrack(id: string) {
    if (currentId === id) stopSound();
    setLocalTracks((prev) => prev.filter((t) => t.id !== id));
  }

  async function seekTo(ratio: number) {
    if (!soundRef.current || !duration) return;
    await soundRef.current.setPositionAsync(Math.floor(ratio * duration));
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const currentStation = STATIONS.find((s) => s.id === currentId && source === "radio");
  const currentTrack = localTracks.find((t) => t.id === currentId && source === "local");
  const currentSpotifyTrack = spotifyResults.find((t) => t.id === currentId && source === "spotify");
  const nowPlayingName = currentStation?.name ?? currentTrack?.name ?? (currentSpotifyTrack ? `${currentSpotifyTrack.name} · ${currentSpotifyTrack.artists}` : null);
  const nowPlayingColor = currentStation?.color ?? (source === "spotify" ? "#1DB954" : "#6366f1");
  const nowPlayingEmoji = currentStation?.emoji ?? (source === "spotify" ? "🎧" : "🎵");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.music ?? "Music"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Now Playing Bar */}
      {nowPlayingName && (
        <View style={[styles.nowPlaying, { backgroundColor: nowPlayingColor + "18", borderColor: nowPlayingColor + "50", marginHorizontal: 16 }]}>
          <Text style={styles.nowPlayingEmoji}>{nowPlayingEmoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.npLabel, { color: colors.mutedForeground }]}>
              {isLoading ? "Loading…" : isPlaying ? "Now Playing" : "Paused"}
            </Text>
            <Text style={[styles.npName, { color: colors.foreground }]} numberOfLines={1}>
              {nowPlayingName}
            </Text>
            {/* Progress bar (local only) */}
            {source === "local" && duration > 0 && (
              <View style={styles.progressRow}>
                <Pressable
                  onPress={(e) => {
                    const ratio = e.nativeEvent.locationX / 160;
                    seekTo(Math.max(0, Math.min(1, ratio)));
                  }}
                  style={[styles.progressBar, { backgroundColor: colors.border }]}
                >
                  <View style={[styles.progressFill, { backgroundColor: nowPlayingColor, width: `${(position / duration) * 100}%` }]} />
                </Pressable>
                <Text style={[styles.progressTime, { color: colors.mutedForeground }]}>
                  {formatTime(position)}/{formatTime(duration)}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={async () => {
              if (isPlaying) { await soundRef.current?.pauseAsync(); setIsPlaying(false); }
              else { await soundRef.current?.playAsync(); setIsPlaying(true); }
            }}
            style={[styles.playPauseBtn, { backgroundColor: nowPlayingColor }]}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={stopSound} style={styles.stopBtn}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map((tp) => (
          <Pressable
            key={tp}
            onPress={() => setTab(tp)}
            style={[styles.tabBtn, tab === tp && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabLabel, { color: tab === tp ? colors.primary : colors.mutedForeground }]}>
              {tp === "Spotify" ? "🎧 Spotify" : tp === "Phone" ? "📱 My Music" : tp === "Radio" ? "📻 Radio" : "🔗 Apps"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>

        {/* ── Spotify Tab ─────────────────────────────────────────── */}
        {tab === "Spotify" && (
          <>
            {/* Search bar */}
            <View style={[styles.spotifySearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.spotifyInput, { color: colors.foreground }]}
                placeholder="Search songs, artists, albums…"
                placeholderTextColor={colors.mutedForeground}
                value={spotifyQuery}
                onChangeText={setSpotifyQuery}
                onSubmitEditing={() => searchSpotify(spotifyQuery)}
                returnKeyType="search"
              />
              {spotifyQuery.length > 0 && (
                <Pressable onPress={() => { setSpotifyQuery(""); fetchFeatured(); }} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {spotifyQuery.trim() ? "SEARCH RESULTS" : "🔥 TRENDING IN INDIA"}
            </Text>

            {spotifyLoading && (
              <View style={styles.spotifyCenter}>
                <Ionicons name="musical-notes" size={40} color="#1DB954" />
                <Text style={[styles.spotifyCenterText, { color: colors.mutedForeground }]}>Loading…</Text>
              </View>
            )}

            {spotifyError && !spotifyLoading && (
              <View style={styles.spotifyCenter}>
                <Ionicons name="warning-outline" size={36} color="#ef4444" />
                <Text style={[styles.spotifyCenterText, { color: colors.mutedForeground }]}>{spotifyError}</Text>
                <Pressable
                  onPress={fetchFeatured}
                  style={[styles.spotifyRetry, { backgroundColor: "#1DB954" }]}
                >
                  <Text style={styles.spotifyRetryText}>Try Again</Text>
                </Pressable>
              </View>
            )}

            {!spotifyLoading && !spotifyError && spotifyResults.map((track) => {
              const isActive = currentId === track.id && source === "spotify";
              return (
                <View
                  key={track.id}
                  style={[styles.spotifyCard, {
                    backgroundColor: isActive ? "#1DB95414" : colors.card,
                    borderColor: isActive ? "#1DB954" : colors.border,
                  }]}
                >
                  {track.image ? (
                    <Image source={{ uri: track.image }} style={styles.spotifyAlbumArt} />
                  ) : (
                    <View style={[styles.spotifyAlbumArt, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                      <Ionicons name="musical-note" size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.spotifyTrackName, { color: colors.foreground }]} numberOfLines={1}>
                      {track.name}
                    </Text>
                    <Text style={[styles.spotifyArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {track.artists}
                    </Text>
                    <Text style={[styles.spotifyDuration, { color: colors.mutedForeground }]}>
                      {formatMs(track.duration_ms)}
                    </Text>
                  </View>
                  {/* Preview play button */}
                  {track.preview_url && (
                    <Pressable
                      onPress={() => playUri(track.id, track.preview_url!, "spotify")}
                      style={[styles.spotifyPlayBtn, { backgroundColor: isActive && isPlaying ? "#1DB954" : colors.border }]}
                    >
                      <Ionicons
                        name={isActive && isPlaying ? "pause" : "play"}
                        size={16}
                        color={isActive && isPlaying ? "#fff" : colors.mutedForeground}
                      />
                    </Pressable>
                  )}
                  {/* Open in Spotify */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (track.spotify_url) Linking.openURL(track.spotify_url);
                    }}
                    style={styles.spotifyOpenBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="open-outline" size={18} color="#1DB954" />
                  </Pressable>
                </View>
              );
            })}

            {/* Powered by Spotify */}
            {!spotifyLoading && (
              <View style={styles.spotifyFooter}>
                <Text style={[styles.spotifyFooterText, { color: colors.mutedForeground }]}>
                  🎧 Powered by Spotify · Tap ▶ for 30-sec preview · Tap ↗ to open full song in Spotify
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Phone Music Tab ─────────────────────────────────────── */}
        {tab === "Phone" && (
          <>
            <Pressable
              onPress={pickLocalMusic}
              style={({ pressed }) => [styles.pickBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="musical-notes" size={20} color="#fff" />
              <Text style={styles.pickBtnText}>Pick Songs from Phone</Text>
            </Pressable>

            {localTracks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-note-outline" size={56} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No songs added yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Tap the button above to pick MP3, AAC, FLAC or any audio file from your phone
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  {localTracks.length} SONG{localTracks.length !== 1 ? "S" : ""}
                </Text>
                {localTracks.map((track, i) => {
                  const active = currentId === track.id && source === "local";
                  return (
                    <View
                      key={track.id}
                      style={[styles.trackCard, {
                        backgroundColor: active ? "#6366f114" : colors.card,
                        borderColor: active ? "#6366f1" : colors.border,
                      }]}
                    >
                      <View style={[styles.trackNum, { backgroundColor: active ? "#6366f1" : colors.border }]}>
                        {active && isPlaying
                          ? <Ionicons name="musical-notes" size={14} color="#fff" />
                          : <Text style={[styles.trackNumText, { color: active ? "#fff" : colors.mutedForeground }]}>{i + 1}</Text>
                        }
                      </View>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => playUri(track.id, track.uri, "local")}
                      >
                        <Text style={[styles.trackName, { color: colors.foreground }]} numberOfLines={1}>
                          {track.name}
                        </Text>
                        {track.size && (
                          <Text style={[styles.trackSize, { color: colors.mutedForeground }]}>
                            {(track.size / 1024 / 1024).toFixed(1)} MB
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => playUri(track.id, track.uri, "local")}
                        style={[styles.trackPlayBtn, { backgroundColor: active ? "#6366f1" : colors.border }]}
                      >
                        <Ionicons name={active && isPlaying ? "pause" : "play"} size={16} color={active ? "#fff" : colors.mutedForeground} />
                      </Pressable>
                      <Pressable onPress={() => removeTrack(track.id)} hitSlop={8}>
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── Radio Tab ───────────────────────────────────────────── */}
        {tab === "Radio" && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LIVE STATIONS</Text>
            {STATIONS.map((station) => {
              const active = currentId === station.id && source === "radio";
              return (
                <Pressable
                  key={station.id}
                  onPress={() => playUri(station.id, station.url, "radio")}
                  style={({ pressed }) => [
                    styles.stationCard,
                    { backgroundColor: active ? station.color + "14" : colors.card, borderColor: active ? station.color : colors.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[styles.stationIcon, { backgroundColor: station.color + "20" }]}>
                    <Text style={styles.stationEmoji}>{station.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stationName, { color: colors.foreground }]}>{station.name}</Text>
                    <Text style={[styles.stationGenre, { color: colors.mutedForeground }]}>{station.genre} · Internet Radio</Text>
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
          </>
        )}

        {/* ── Apps Tab ────────────────────────────────────────────── */}
        {tab === "Apps" && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPEN IN</Text>
            {MUSIC_APPS.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(app.url); }}
                style={({ pressed }) => [
                  styles.appRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[styles.appIconBox, { backgroundColor: app.color + "20" }]}>
                  <Text style={styles.appEmoji}>{app.emoji}</Text>
                </View>
                <Text style={[styles.appRowName, { color: colors.foreground }]}>{app.name}</Text>
                <Feather name="external-link" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  nowPlaying: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, gap: 10, marginBottom: 4,
  },
  nowPlayingEmoji: { fontSize: 28 },
  npLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  npName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  playPauseBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  stopBtn: { padding: 6 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  content: { padding: 16, gap: 12 },
  pickBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 54, borderRadius: 16,
  },
  pickBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  trackCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  trackNum: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  trackNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  trackName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  trackSize: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  trackPlayBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stationCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, borderWidth: 1, gap: 14 },
  stationIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stationEmoji: { fontSize: 24 },
  stationName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stationGenre: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  playIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  appRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  appIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  appEmoji: { fontSize: 24 },
  appRowName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Spotify styles
  spotifySearch: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, height: 48, borderRadius: 14, borderWidth: 1,
  },
  spotifyInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  spotifyCenter: { alignItems: "center", paddingVertical: 40, gap: 12 },
  spotifyCenterText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  spotifyRetry: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  spotifyRetryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  spotifyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 10, borderRadius: 16, borderWidth: 1,
  },
  spotifyAlbumArt: { width: 52, height: 52, borderRadius: 10 },
  spotifyTrackName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  spotifyArtist: { fontSize: 12, fontFamily: "Inter_400Regular" },
  spotifyDuration: { fontSize: 11, fontFamily: "Inter_400Regular" },
  spotifyPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  spotifyOpenBtn: { padding: 6 },
  spotifyFooter: { alignItems: "center", paddingTop: 8 },
  spotifyFooterText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
});
