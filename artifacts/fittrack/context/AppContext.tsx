import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
};

export type WorkoutLog = {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: Exercise[];
  calories: number;
};

export type Goal = {
  weeklyWorkouts: number;
  dailyCalories: number;
  dailySteps: number;
};

type AppContextType = {
  workoutLogs: WorkoutLog[];
  goals: Goal;
  streak: number;
  addWorkoutLog: (log: WorkoutLog) => void;
  updateGoals: (goals: Goal) => void;
  getThisWeekLogs: () => WorkoutLog[];
  getTodayLogs: () => WorkoutLog[];
};

const defaultGoals: Goal = {
  weeklyWorkouts: 4,
  dailyCalories: 500,
  dailySteps: 10000,
};

const AppContext = createContext<AppContextType>({
  workoutLogs: [],
  goals: defaultGoals,
  streak: 0,
  addWorkoutLog: () => {},
  updateGoals: () => {},
  getThisWeekLogs: () => [],
  getTodayLogs: () => [],
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [goals, setGoals] = useState<Goal>(defaultGoals);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [logsRaw, goalsRaw] = await Promise.all([
        AsyncStorage.getItem("workoutLogs"),
        AsyncStorage.getItem("goals"),
      ]);
      if (logsRaw) {
        const logs: WorkoutLog[] = JSON.parse(logsRaw);
        setWorkoutLogs(logs);
        setStreak(computeStreak(logs));
      }
      if (goalsRaw) setGoals(JSON.parse(goalsRaw));
    } catch {}
  }

  function computeStreak(logs: WorkoutLog[]): number {
    if (!logs.length) return 0;
    const dates = Array.from(
      new Set(logs.map((l) => l.date.split("T")[0]))
    ).sort((a, b) => b.localeCompare(a));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diff = Math.floor(
        (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === i || diff === i + 1) count++;
      else break;
    }
    return count;
  }

  async function addWorkoutLog(log: WorkoutLog) {
    const updated = [log, ...workoutLogs];
    setWorkoutLogs(updated);
    setStreak(computeStreak(updated));
    await AsyncStorage.setItem("workoutLogs", JSON.stringify(updated));
  }

  async function updateGoals(g: Goal) {
    setGoals(g);
    await AsyncStorage.setItem("goals", JSON.stringify(g));
  }

  function getThisWeekLogs() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutLogs.filter((l) => new Date(l.date) >= weekAgo);
  }

  function getTodayLogs() {
    const today = new Date().toISOString().split("T")[0];
    return workoutLogs.filter((l) => l.date.startsWith(today));
  }

  return (
    <AppContext.Provider
      value={{
        workoutLogs,
        goals,
        streak,
        addWorkoutLog,
        updateGoals,
        getThisWeekLogs,
        getTodayLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
