import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ACTIVITY_KEY = "@zenspace_activities";
const MOOD_KEY = "@zenspace_moods";
const MAX_ENTRIES = 100;

export type ActivityEntry = {
  tool: string;
  label: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
};

export type MoodEntry = {
  mood: 1 | 2 | 3 | 4 | 5; // 1=great, 5=very sad
  timestamp: number;
  date: string;
};

type ActivityContextType = {
  activities: ActivityEntry[];
  todayMood: number | null;
  todayActivities: ActivityEntry[];
  logActivity: (tool: string, label: string) => void;
  setMood: (mood: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  getAIContext: () => string;
  getTopToolsToday: () => { tool: string; label: string; count: number }[];
};

const ActivityContext = createContext<ActivityContextType>({
  activities: [],
  todayMood: null,
  todayActivities: [],
  logActivity: () => {},
  setMood: async () => {},
  getAIContext: () => "",
  getTopToolsToday: () => [],
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [todayMood, setTodayMoodState] = useState<number | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadData();
  }, []);

  async function loadData() {
    try {
      const [actRaw, moodRaw] = await Promise.all([
        AsyncStorage.getItem(ACTIVITY_KEY),
        AsyncStorage.getItem(MOOD_KEY),
      ]);
      if (actRaw) setActivities(JSON.parse(actRaw));
      if (moodRaw) {
        const moods: MoodEntry[] = JSON.parse(moodRaw);
        const todayMoodEntry = moods.findLast?.((m) => m.date === todayStr()) ??
          moods.filter((m) => m.date === todayStr()).pop();
        if (todayMoodEntry) setTodayMoodState(todayMoodEntry.mood);
      }
    } catch {}
  }

  const logActivity = useCallback((tool: string, label: string) => {
    const entry: ActivityEntry = {
      tool, label, timestamp: Date.now(), date: todayStr(),
    };
    setActivities((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  async function setMood(mood: 1 | 2 | 3 | 4 | 5) {
    setTodayMoodState(mood);
    try {
      const raw = await AsyncStorage.getItem(MOOD_KEY);
      const moods: MoodEntry[] = raw ? JSON.parse(raw) : [];
      const today = todayStr();
      const filtered = moods.filter((m) => m.date !== today);
      const updated = [{ mood, timestamp: Date.now(), date: today }, ...filtered].slice(0, 60);
      await AsyncStorage.setItem(MOOD_KEY, JSON.stringify(updated));
    } catch {}
  }

  const todayActivities = activities.filter((a) => a.date === todayStr());

  function getTopToolsToday() {
    const counts: Record<string, { label: string; count: number }> = {};
    todayActivities.forEach(({ tool, label }) => {
      if (!counts[tool]) counts[tool] = { label, count: 0 };
      counts[tool].count++;
    });
    return Object.entries(counts)
      .map(([tool, { label, count }]) => ({ tool, label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  function getAIContext(): string {
    const top = getTopToolsToday();
    const mood = todayMood;
    const lines: string[] = [];

    if (mood !== null) {
      const moodLabels = ["", "great", "good", "okay", "a bit down", "struggling"];
      lines.push(`User's mood today: ${moodLabels[mood] ?? "unknown"}.`);
    }

    if (top.length > 0) {
      const used = top.map((t) => `${t.label} (${t.count}x)`).join(", ");
      lines.push(`Tools used today: ${used}.`);
    }

    const totalToday = todayActivities.length;
    if (totalToday > 0) {
      lines.push(`Total tool opens today: ${totalToday}.`);
    }

    return lines.join(" ");
  }

  return (
    <ActivityContext.Provider value={{
      activities, todayMood, todayActivities,
      logActivity, setMood, getAIContext, getTopToolsToday,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  return useContext(ActivityContext);
}
