import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const COUNTER_KEY = "@zenspace_tool_opens";
const SHOW_EVERY = 4;

// ── Safe dynamic load — prevents startup crash if AdMob SDK fails ────────────
let AdEventType: any = null;
let InterstitialAd: any = null;
let TestIds: any = null;
let admobAvailable = false;

try {
  const admob = require("react-native-google-mobile-ads");
  AdEventType = admob.AdEventType;
  InterstitialAd = admob.InterstitialAd;
  TestIds = admob.TestIds;
  admobAvailable = true;
} catch {
  admobAvailable = false;
}

const androidAdUnitId = admobAvailable
  ? (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? TestIds?.INTERSTITIAL)
  : null;
const iosAdUnitId = admobAvailable
  ? (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? TestIds?.INTERSTITIAL)
  : null;
const adUnitId = Platform.OS === "ios" ? iosAdUnitId : androidAdUnitId;

let _ad: any = null;
let _adLoaded = false;

function getAd() {
  if (!admobAvailable || !InterstitialAd || !adUnitId) return null;
  if (!_ad) {
    try {
      _ad = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });
    } catch {
      return null;
    }
  }
  return _ad;
}

export async function trackToolOpen(isPro: boolean) {
  if (isPro || !admobAvailable) return;
  try {
    const raw = await AsyncStorage.getItem(COUNTER_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    const next = count + 1;
    await AsyncStorage.setItem(COUNTER_KEY, String(next));
    if (next % SHOW_EVERY === 0) showInterstitialAd();
  } catch {}
}

function showInterstitialAd() {
  try {
    const ad = getAd();
    if (!ad) return;
    if (_adLoaded) {
      ad.show().catch(() => {});
      _adLoaded = false;
      setTimeout(() => { try { ad.load(); } catch {} }, 1000);
    } else {
      const unsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        _adLoaded = true;
        ad.show().catch(() => {});
        _adLoaded = false;
        unsub();
        setTimeout(() => { try { ad.load(); } catch {} }, 1000);
      });
      ad.load();
    }
  } catch {}
}

export function usePreloadInterstitial() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || Platform.OS === "web" || !admobAvailable) return;
    loaded.current = true;
    try {
      const ad = getAd();
      if (!ad) return;
      const unsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        _adLoaded = true;
        unsub();
      });
      ad.load();
    } catch {}
  }, []);
}
