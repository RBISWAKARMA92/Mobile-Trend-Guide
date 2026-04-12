import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const TOOLS_KEY = "@zenspace_opened_tools";
const RATED_KEY = "@zenspace_has_rated";
const THRESHOLD = 5;

export async function trackToolForRating(toolId: string): Promise<void> {
  try {
    const alreadyRated = await AsyncStorage.getItem(RATED_KEY);
    if (alreadyRated) return;

    const raw = await AsyncStorage.getItem(TOOLS_KEY);
    const opened: string[] = raw ? JSON.parse(raw) : [];

    if (!opened.includes(toolId)) {
      const next = [...opened, toolId];
      await AsyncStorage.setItem(TOOLS_KEY, JSON.stringify(next));

      if (next.length >= THRESHOLD) {
        const available = await StoreReview.isAvailableAsync();
        if (available) {
          await StoreReview.requestReview();
          await AsyncStorage.setItem(RATED_KEY, "1");
        }
      }
    }
  } catch (_) {}
}
