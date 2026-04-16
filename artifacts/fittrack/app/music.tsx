import { Feather, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { getApiBase } from "@/constants/api";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { trackToolOpen } from "@/components/InterstitialAdManager";
import BannerAdView from "@/components/BannerAdView";
import RewardedAdModal from "@/components/RewardedAdModal";

const YT_FREE_DAILY = 5;
const YT_AD_BONUS = 5;
const YT_MAX_AD_UNLOCKS = 3;
const YT_STORAGE_KEY = "yt_search_quota";

const API_BASE = getApiBase();

type Station = { id: string; name: string; genre: string; url: string; emoji: string; color: string };
type LocalTrack = { id: string; name: string; uri: string; size?: number };
type PlayingSource = "radio" | "local" | "spotify";
type SpotifyTrack = {
  id: string; name: string; artists: string; album: string;
  image: string | null; preview_url: string | null; spotify_url: string | null; duration_ms: number;
};
type YTVideo = {
  id: string; title: string; channel: string;
  thumbnail: string | null; youtube_url: string; ytmusic_url: string;
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

const TABS = ["Spotify", "YouTube", "Phone", "Radio", "Apps"] as const;
type Tab = (typeof TABS)[number];

export default function MusicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const { subscription, rewardAd } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
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

  // YouTube state
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // YouTube monetization state
  const [ytSearchesLeft, setYtSearchesLeft] = useState(YT_FREE_DAILY);
  const [ytAdUnlocksLeft, setYtAdUnlocksLeft] = useState(YT_MAX_AD_UNLOCKS);
  const [showYtPaywall, setShowYtPaywall] = useState(false);
  const [showYtRewardAd, setShowYtRewardAd] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
    return () => { stopSound(); };
  }, []);

  // Load YouTube daily quota from storage
  useEffect(() => {
    if (isPro) return;
    AsyncStorage.getItem(YT_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        const today = new Date().toDateString();
        if (saved.date === today) {
          setYtSearchesLeft(saved.searchesLeft ?? YT_FREE_DAILY);
          setYtAdUnlocksLeft(saved.adUnlocksLeft ?? YT_MAX_AD_UNLOCKS);
        }
      } catch {}
    });
  }, [isPro]);

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
    if (tab === "Spotify" && spotifyResults.length === 0) fetchFeatured();
    if (tab === "YouTube" && ytResults.length === 0) fetchYTTrending();
  }, [tab]);

  async function fetchFeatured() {
    setSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const r = await fetch(`${API_BASE}/spotify/featured`);
      const data = await r.json();
      if (data.tracks) setSpotifyResults(data.tracks);
      else setSpotifyError("Spotify temporarily unavailable. Try YouTube tab!");
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

  async function fetchYTTrending() {
    setYtLoading(true);
    setYtError(null);
    try {
      const r = await fetch(`${API_BASE}/youtube/trending`);
      const data = await r.json();
      if (data.videos) setYtResults(data.videos);
      else setYtError(data.error ?? "Could not load videos");
    } catch {
      setYtError("Network error. Check connection.");
    } finally {
      setYtLoading(false);
    }
  }

  function saveYtQuota(searchesLeft: number, adUnlocksLeft: number) {
    AsyncStorage.setItem(YT_STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      searchesLeft,
      adUnlocksLeft,
    }));
  }

  async function searchYouTube(q: string) {
    if (!q.trim()) { fetchYTTrending(); return; }

    // Enforce daily limit for free users
    if (!isPro) {
      if (ytSearchesLeft <= 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setShowYtPaywall(true);
        return;
      }
      const newLeft = ytSearchesLeft - 1;
      setYtSearchesLeft(newLeft);
      saveYtQuota(newLeft, ytAdUnlocksLeft);
    }

    setYtLoading(true);
    setYtError(null);
    try {
      const r = await fetch(`${API_BASE}/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (data.videos) setYtResults(data.videos);
      else setYtError(data.error ?? "No results");
    } catch {
      setYtError("Network error. Check connection.");
    } finally {
      setYtLoading(false);
    }
  }

  async function handleYtAdRewarded() {
    await rewardAd();
    const newUnlocks = Math.max(0, ytAdUnlocksLeft - 1);
    const newSearches = ytSearchesLeft + YT_AD_BONUS;
    setYtAdUnlocksLeft(newUnlocks);
    setYtSearchesLeft(newSearches);
    saveYtQuota(newSearches, newUnlocks);
    setShowYtPaywall(false);
    setShowYtRewardAd(false);
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
              {tp === "Spotify" ? "🎧 Spotify" : tp === "YouTube" ? "▶️ YouTube" : tp === "Phone" ? "📱 My Music" : tp === "Radio" ? "📻 Radio" : "🔗 Apps"}
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
                <Ionicons name="musical-notes-outline" size={48} color="#1DB954" />
                <Text style={[styles.spotifyCenterText, { color: colors.foreground, fontWeight: "700", fontSize: 16 }]}>
                  Spotify Unavailable
                </Text>
                <Text style={[styles.spotifyCenterText, { color: colors.mutedForeground, fontSize: 13, marginTop: 4 }]}>
                  Spotify service is temporarily down.{"\n"}YouTube Music is working perfectly!
                </Text>
                <Pressable
                  onPress={() => setTab("YouTube")}
                  style={[styles.spotifyRetry, { backgroundColor: "#FF0000", marginTop: 16 }]}
                >
                  <Ionicons name="logo-youtube" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.spotifyRetryText}>Switch to YouTube</Text>
                </Pressable>
                <Pressable onPress={fetchFeatured} style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Retry Spotify</Text>
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

        {/* ── YouTube Tab ─────────────────────────────────────────── */}
        {tab === "YouTube" && (
          <>
            {/* Search bar + quota badge */}
            <View style={{ gap: 6 }}>
              <View style={[styles.spotifySearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.spotifyInput, { color: colors.foreground }]}
                  placeholder="Search music videos…"
                  placeholderTextColor={colors.mutedForeground}
                  value={ytQuery}
                  onChangeText={setYtQuery}
                  onSubmitEditing={() => searchYouTube(ytQuery)}
                  returnKeyType="search"
                />
                {ytQuery.length > 0 && (
                  <Pressable onPress={() => { setYtQuery(""); fetchYTTrending(); }} hitSlop={8}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
              {!isPro && (
                <View style={styles.ytQuotaRow}>
                  <Ionicons name="search" size={12} color={ytSearchesLeft <= 1 ? "#ef4444" : colors.mutedForeground} />
                  <Text style={[styles.ytQuotaText, { color: ytSearchesLeft <= 1 ? "#ef4444" : colors.mutedForeground }]}>
                    {ytSearchesLeft <= 0 ? "Daily limit reached" : `${ytSearchesLeft} free searches left today`}
                  </Text>
                  {ytSearchesLeft <= 2 && (
                    <Pressable onPress={() => setShowYtPaywall(true)} hitSlop={8}>
                      <Text style={[styles.ytQuotaLink, { color: colors.primary }]}>Get more →</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {ytQuery.trim() ? "SEARCH RESULTS" : "🔥 TRENDING MUSIC IN INDIA"}
            </Text>

            {ytLoading && (
              <View style={styles.spotifyCenter}>
                <Ionicons name="logo-youtube" size={40} color="#FF0000" />
                <Text style={[styles.spotifyCenterText, { color: colors.mutedForeground }]}>Loading…</Text>
              </View>
            )}

            {ytError && !ytLoading && (
              <View style={styles.spotifyCenter}>
                <Ionicons name="warning-outline" size={36} color="#ef4444" />
                <Text style={[styles.spotifyCenterText, { color: colors.mutedForeground }]}>{ytError}</Text>
                <Pressable onPress={fetchYTTrending} style={[styles.spotifyRetry, { backgroundColor: "#FF0000" }]}>
                  <Text style={styles.spotifyRetryText}>Try Again</Text>
                </Pressable>
              </View>
            )}

            {!ytLoading && !ytError && ytResults.map((video) => (
              <View
                key={video.id}
                style={[styles.ytCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {video.thumbnail ? (
                  <Image source={{ uri: video.thumbnail }} style={styles.ytThumb} />
                ) : (
                  <View style={[styles.ytThumb, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.ytTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={[styles.ytChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {video.channel}
                  </Text>
                </View>
                <View style={{ gap: 8, alignItems: "center" }}>
                  {/* Open in YouTube */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(video.youtube_url); }}
                    style={[styles.ytBtn, { backgroundColor: "#FF000020" }]}
                    hitSlop={4}
                  >
                    <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                  </Pressable>
                  {/* Open in YT Music */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(video.ytmusic_url); }}
                    style={[styles.ytBtn, { backgroundColor: "#FF000020" }]}
                    hitSlop={4}
                  >
                    <Ionicons name="musical-note" size={18} color="#FF0000" />
                  </Pressable>
                </View>
              </View>
            ))}

            {!ytLoading && (
              <View style={styles.spotifyFooter}>
                <Text style={[styles.spotifyFooterText, { color: colors.mutedForeground }]}>
                  ▶️ Powered by YouTube · Tap the YouTube icon to watch · Tap the note to open in YT Music
                </Text>
              </View>
            )}

            {/* Banner ad for free users */}
            {!isPro && Platform.OS !== "web" && (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <BannerAdView />
              </View>
            )}

            {/* Free user upgrade banner (web fallback / always visible teaser) */}
            {!isPro && (
              <Pressable
                onPress={() => setShowYtPaywall(true)}
                style={[styles.ytUpgradeBanner, { backgroundColor: "#FF000012", borderColor: "#FF000040" }]}
              >
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ytUpgradeTitle, { color: colors.foreground }]}>Go Pro — Unlimited YouTube Searches</Text>
                  <Text style={[styles.ytUpgradeSub, { color: colors.mutedForeground }]}>
                    Free: {YT_FREE_DAILY}/day · Watch ad: +{YT_AD_BONUS} · Pro: ∞
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FF0000" />
              </Pressable>
            )}

            {/* Paywall bottom sheet */}
            {showYtPaywall && (
              <View style={[styles.ytPaywall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.ytPaywallTitle, { color: colors.foreground }]}>🔍 Daily Search Limit Reached</Text>
                <Text style={[styles.ytPaywallSub, { color: colors.mutedForeground }]}>
                  You've used all {YT_FREE_DAILY} free YouTube searches for today. Reset at midnight.
                </Text>

                {ytAdUnlocksLeft > 0 && (
                  <Pressable
                    onPress={() => { setShowYtPaywall(false); setShowYtRewardAd(true); }}
                    style={[styles.ytPaywallBtn, { backgroundColor: "#FF0000" }]}
                  >
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={styles.ytPaywallBtnText}>Watch Ad → +{YT_AD_BONUS} Searches ({ytAdUnlocksLeft} left today)</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => { setShowYtPaywall(false); router.push("/subscription"); }}
                  style={[styles.ytPaywallBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.ytPaywallBtnText}>Go Pro — Unlimited Searches ₹399/yr</Text>
                </Pressable>

                <Pressable onPress={() => setShowYtPaywall(false)} style={{ alignItems: "center", paddingTop: 4 }}>
                  <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular" }, { color: colors.mutedForeground }]}>Dismiss</Text>
                </Pressable>
              </View>
            )}

            {/* Rewarded ad modal */}
            <RewardedAdModal
              visible={showYtRewardAd}
              onClose={() => setShowYtRewardAd(false)}
              onRewarded={handleYtAdRewarded}
              creditsEarned={10}
            />
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

  // YouTube styles
  ytCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  ytThumb: { width: 100, height: 68 },
  ytTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  ytChannel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ytBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // YouTube monetization styles
  ytQuotaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  ytQuotaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  ytQuotaLink: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  ytUpgradeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 4,
  },
  ytUpgradeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ytUpgradeSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  ytPaywall: {
    borderRadius: 24, borderWidth: 1, padding: 20, gap: 14, marginTop: 8,
  },
  ytPaywallTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  ytPaywallSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  ytPaywallBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
  },
  ytPaywallBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff", flex: 1 },
});
