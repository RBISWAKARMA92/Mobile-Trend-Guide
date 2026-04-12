import AsyncStorage from "@react-native-async-storage/async-storage";

const COUNTER_KEY = "@zenspace_tool_opens";
const SHOW_EVERY = 4;

// AdMob Interstitial temporarily disabled for app stability.
// This file is kept so the API surface is unchanged.

export async function trackToolOpen(_isPro: boolean) {
  // no-op — interstitial ads re-enabled in future update
}

export function usePreloadInterstitial() {
  // no-op
}
