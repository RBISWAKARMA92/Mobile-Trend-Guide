import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { usePreloadInterstitial } from "@/components/InterstitialAdManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "zenspace_seen_onboarding_v1";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const AUTH_SCREENS = ["login", "otp-verify"];

function RootLayoutNav() {
  const { t } = useLanguage();
  const { token, isLoading } = useAuth();
  usePreloadInterstitial();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const currentSegment = segments[0] as string | undefined;
    const inAuthScreen = AUTH_SCREENS.includes(currentSegment ?? "");
    const inOnboarding = currentSegment === "onboarding";

    if (token && inAuthScreen) {
      router.replace("/");
      return;
    }

    if (!inOnboarding) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((seen) => {
        if (!seen) router.replace("/onboarding");
      });
    }
  }, [token, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen
        name="calculator"
        options={{ headerShown: true, title: t.calculator, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="converter"
        options={{ headerShown: true, title: t.converter, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="timer"
        options={{ headerShown: true, title: t.timer, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="notes"
        options={{ headerShown: true, title: t.notes, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="tip"
        options={{ headerShown: true, title: t.tip, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="bmi"
        options={{ headerShown: true, title: t.bmi, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="age"
        options={{ headerShown: true, title: t.age, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="password"
        options={{ headerShown: true, title: t.password, headerBackTitle: "" }}
      />
      <Stack.Screen
        name="language"
        options={{ headerShown: true, title: t.selectLanguage, headerBackTitle: "" }}
      />
      <Stack.Screen name="kids-zone" options={{ headerShown: false }} />
      <Stack.Screen name="flashlight" options={{ headerShown: false }} />
      <Stack.Screen name="expense" options={{ headerShown: false }} />
      <Stack.Screen name="world-clock" options={{ headerShown: false }} />
      <Stack.Screen name="qr-code" options={{ headerShown: false }} />
      <Stack.Screen name="voice-recorder" options={{ headerShown: false }} />
      <Stack.Screen name="video-recorder" options={{ headerShown: false }} />
      <Stack.Screen name="music" options={{ headerShown: false }} />
      <Stack.Screen name="reminders" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="chant-counter" options={{ headerShown: false }} />
      <Stack.Screen name="breathing" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ActivityProvider>
              <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </QueryClientProvider>
            </ActivityProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
