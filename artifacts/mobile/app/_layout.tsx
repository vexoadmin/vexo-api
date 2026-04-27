import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthScreenContent } from "@/app/auth";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SavedItemsProvider } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  const { mode, isHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || mode === null) return;

    const extractFirstHttpUrl = (text: string): string | undefined => {
      const match = text.match(/https?:\/\/[^\s<>"')\]}]+/i);
      if (!match?.[0]) return undefined;
      return match[0].replace(/[),.;!?]+$/, "");
    };

    const routeToAddFromIncoming = (incoming: string | null) => {
      if (!incoming || pathname === "/add") return;

      let candidate: string | undefined;
      const trimmed = incoming.trim();
      if (/^vexo:\/\/add/i.test(trimmed)) return;
      if (/^https?:\/\//i.test(trimmed)) {
        candidate = trimmed;
      } else {
        candidate = extractFirstHttpUrl(trimmed);
      }

      if (!candidate) return;
      router.push(`/add?url=${encodeURIComponent(candidate)}`);
    };

    Linking.getInitialURL()
      .then(routeToAddFromIncoming)
      .catch(() => undefined);

    const sub = Linking.addEventListener("url", ({ url }) => {
      routeToAddFromIncoming(url);
    });

    return () => sub.remove();
  }, [isHydrated, mode, pathname, router]);

  if (!isHydrated) return null;
  if (mode === null) return <AuthScreenContent />;

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{
          title: "Save Video",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{
          title: "Video Details",
        }}
      />
      <Stack.Screen
        name="category/[id]"
        options={{
          title: "Category",
        }}
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
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AuthProvider>
                <SavedItemsProvider>
                  <RootLayoutNav />
                </SavedItemsProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
