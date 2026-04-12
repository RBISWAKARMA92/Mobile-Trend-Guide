import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
