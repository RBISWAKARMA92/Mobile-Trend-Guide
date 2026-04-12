import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";

const COUNTER_KEY = "@zenspace_tool_opens";
const SHOW_EVERY = 4; // show interstitial every 4 tool opens for free users

const androidAdUnitId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? TestIds.INTERSTITIAL;
const iosAdUnitId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? TestIds.INTERSTITIAL;
const adUnitId = Platform.OS === "ios" ? iosAdUnitId : androidAdUnitId;

// Singleton ad instance to avoid loading multiple times
let _ad: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;

function getAd() {
  if (!_ad) {
    _ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
  }
  return _ad;
}

export async function trackToolOpen(isPro: boolean) {
  if (isPro) return; // no ads for pro users
  try {
    const raw = await AsyncStorage.getItem(COUNTER_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    const next = count + 1;
    await AsyncStorage.setItem(COUNTER_KEY, String(next));

    if (next % SHOW_EVERY === 0) {
      showInterstitialAd();
    }
  } catch {}
}

let _adLoaded = false;

function showInterstitialAd() {
  const ad = getAd();
  if (_adLoaded) {
    ad.show().catch(() => {});
    _adLoaded = false;
    // Reload for next time
    setTimeout(() => ad.load(), 1000);
  } else {
    // Load and show when ready
    const unsub = ad.addAdEventListener(AdEventType.LOADED, () => {
      _adLoaded = true;
      ad.show().catch(() => {});
      _adLoaded = false;
      unsub();
      setTimeout(() => ad.load(), 1000);
    });
    ad.load();
  }
}

// Pre-load on app start so the first interstitial is ready
export function usePreloadInterstitial() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || Platform.OS === "web") return;
    loaded.current = true;
    try {
      const ad = getAd();
      const unsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        _adLoaded = true;
        unsub();
      });
      ad.load();
    } catch {}
  }, []);
}
