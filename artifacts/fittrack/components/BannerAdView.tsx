import { Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

const androidAdUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? TestIds.BANNER;
const iosAdUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? TestIds.BANNER;
const adUnitId = Platform.OS === "ios" ? iosAdUnitId : androidAdUnitId;

export default function BannerAdView() {
  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
    />
  );
}
