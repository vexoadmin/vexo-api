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

    const decodePossiblyEncoded = (value: string): string => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const extractFirstHttpUrl = (text: string): string | undefined => {
      const match = text.match(/https?:\/\/[^\s<>"')\]}]+/i);
      if (!match?.[0]) return undefined;
      return match[0].replace(/[),.;!?]+$/, "");
    };

    const extractQueryParamUrl = (text: string): string | undefined => {
      const decoded = decodePossiblyEncoded(text);
      const match = decoded.match(/(?:[?&#]|^)(?:url|text)=([^&#]+)/i);
      if (!match?.[1]) return undefined;
      const normalized = decodePossiblyEncoded(match[1]).trim();
      return extractFirstHttpUrl(normalized) || normalized;
    };

    const extractUrlFromVexoAddLink = (incoming: string): string | undefined => {
      try {
        const parsed = new URL(incoming);
        const queryUrl = parsed.searchParams.get("url") || parsed.searchParams.get("text");
        if (queryUrl) {
          const decoded = decodePossiblyEncoded(queryUrl).trim();
          return extractFirstHttpUrl(decoded) || decoded;
        }

        if (parsed.protocol !== "vexo:" || parsed.hostname !== "add") return undefined;
        const fromPath = decodePossiblyEncoded(parsed.pathname || "").trim();
        return extractFirstHttpUrl(fromPath) || undefined;
      } catch {
        return undefined;
      }
    };

    const routeToAddFromIncoming = (incoming: string | null) => {
      if (!incoming) return;

      let candidate: string | undefined;
      const trimmed = incoming.trim();

      console.log("[share] native intent input", trimmed);

      const fromVexoAdd = extractUrlFromVexoAddLink(trimmed);
      if (fromVexoAdd) {
        candidate = fromVexoAdd;
      } else {
        candidate = extractQueryParamUrl(trimmed);
      }
      if (candidate) {
        // use candidate from query-like payloads
      } else if (/^https?:\/\//i.test(trimmed)) {
        candidate = trimmed;
      } else {
        candidate = extractFirstHttpUrl(trimmed);
      }

      if (!candidate) return;
      console.log("[share] extracted url", candidate);
      console.log("[share] route to add", `/add?url=${encodeURIComponent(candidate)}`);

      router.replace({
        pathname: "/add",
        params: { url: candidate },
      });
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        console.log("[share] layout initial url", initialUrl);
        routeToAddFromIncoming(initialUrl);
      })
      .catch(() => undefined);

    const sub = Linking.addEventListener("url", ({ url }) => {
      console.log("[share] layout initial url", url);
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
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
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
