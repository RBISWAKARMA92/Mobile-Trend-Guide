import { Platform, View } from "react-native";

// Safe dynamic load — prevents startup crash if AdMob SDK fails
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let admobAvailable = false;

try {
  const admob = require("react-native-google-mobile-ads");
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
  admobAvailable = true;
} catch {
  admobAvailable = false;
}

const androidAdUnitId = admobAvailable
  ? (process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? TestIds?.BANNER)
  : null;
const iosAdUnitId = admobAvailable
  ? (process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? TestIds?.BANNER)
  : null;
const adUnitId = Platform.OS === "ios" ? iosAdUnitId : androidAdUnitId;

export default function BannerAdView() {
  if (!admobAvailable || !BannerAd || !adUnitId) return <View />;
  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
    />
  );
}
