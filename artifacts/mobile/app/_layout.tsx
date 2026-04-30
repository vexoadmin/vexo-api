import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useShareIntent } from "expo-share-intent";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthScreenContent } from "@/app/auth";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SavedItemsProvider } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";
import { nextQaSequence, qaLog } from "@/utils/qaDebugLog";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  const { mode, isHydrated, user } = useAuth();
  const hasUser = !!user;
  const router = useRouter();
  const pathname = usePathname();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const lastHandledShareUrlRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("[SHARE DEBUG] share handlers initialized", {
      hasShareIntent,
      isHydrated,
      mode,
      pathname,
    });
    qaLog("SHARE", "share handlers initialized", {
      hasShareIntent,
      isHydrated,
      mode,
      pathname,
    });
  }, [hasShareIntent, isHydrated, mode, pathname]);

  useEffect(() => {
    console.log("[AUTH DEBUG] layout auth state:", {
      isHydrated,
      mode,
      hasUser: !!user,
      userId: user?.id ?? null,
    });
    qaLog("AUTH", "layout auth state", {
      isHydrated,
      mode,
      hasUser: !!user,
      userId: user?.id ?? null,
    });
  }, [isHydrated, mode, user?.id]);

  useEffect(() => {
    if (!isHydrated || mode === null) {
      console.log("[SHARE DEBUG] deep link listener skipped", {
        reason: !isHydrated ? "not hydrated" : "mode is null",
        isHydrated,
        mode,
      });
      qaLog("SHARE", "deep link listener skipped", {
        reason: !isHydrated ? "not hydrated" : "mode is null",
      });
      return;
    }
    console.log("[SHARE DEBUG] deep link listener initialized", {
      isHydrated,
      mode,
      pathname,
    });

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
      if (!incoming) {
        qaLog("SHARE", "navigation skipped", { reason: "incoming is empty" });
        console.log("[SHARE DEBUG] navigation skipped: incoming is empty");
        return;
      }

      let candidate: string | undefined;
      const trimmed = incoming.trim();
      const sequence = nextQaSequence("SHARE");
      qaLog("SHARE", "payload received", { sequence, incoming: trimmed });
      console.log("[SHARE DEBUG] share payload received", { incoming: trimmed });

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

      if (!candidate) {
        qaLog("SHARE", "navigation skipped", {
          sequence,
          reason: "no URL extracted",
        });
        console.log("[SHARE DEBUG] navigation skipped: no URL extracted", {
          incoming: trimmed,
        });
        return;
      }
      qaLog("SHARE", "extracted URL", { sequence, url: candidate });
      console.log("[SHARE DEBUG] extracted URL", candidate);
      console.log("[share] extracted url", candidate);
      console.log("[share] route to add", `/add?url=${encodeURIComponent(candidate)}`);
      console.log("[SHARE DEBUG] navigating to /add", {
        pathname: "/add",
        url: candidate,
      });
      qaLog("SHARE", "navigating to /add", {
        sequence,
        pathname: "/add",
        url: candidate,
      });

      router.replace({
        pathname: "/add",
        params: { url: candidate },
      });
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        qaLog("SHARE", "initial URL received", { initialUrl });
        console.log("[SHARE DEBUG] Linking.getInitialURL result", { initialUrl });
        console.log("[share] layout initial url", initialUrl);
        routeToAddFromIncoming(initialUrl);
      })
      .catch(() => undefined);

    const sub = Linking.addEventListener("url", ({ url }) => {
      qaLog("SHARE", "linking url event", { url });
      console.log("[SHARE DEBUG] Linking url event received", { url });
      console.log("[share] layout initial url", url);
      routeToAddFromIncoming(url);
    });

    return () => {
      console.log("[SHARE DEBUG] deep link listener removed");
      qaLog("SHARE", "deep link listener removed");
      sub.remove();
    };
  }, [isHydrated, mode, pathname, router]);

  useEffect(() => {
    if (!isHydrated || mode === null || !hasShareIntent) {
      console.log("[SHARE DEBUG] share intent effect skipped", {
        reason: !isHydrated
          ? "not hydrated"
          : mode === null
            ? "mode is null"
            : "hasShareIntent is false",
        isHydrated,
        mode,
        hasShareIntent,
      });
      qaLog("SHARE", "share intent effect skipped", {
        reason: !isHydrated
          ? "not hydrated"
          : mode === null
            ? "mode is null"
            : "hasShareIntent is false",
      });
      return;
    }
    console.log("[SHARE DEBUG] share intent effect initialized", {
      hasShareIntent,
      isHydrated,
      mode,
    });

    const extractFirstHttpUrl = (text: string): string | undefined => {
      const match = text.match(/https?:\/\/[^\s<>"')\]}]+/i);
      if (!match?.[0]) return undefined;
      return match[0].replace(/[),.;!?]+$/, "");
    };

    const sharedText = (shareIntent?.text || "").trim();
    const sharedWebUrl = (shareIntent?.webUrl || "").trim();
    const sequence = nextQaSequence("SHARE");
    qaLog("SHARE", "payload received", {
      sequence,
      shareText: sharedText,
      shareWebUrl: sharedWebUrl,
    });
    console.log("[SHARE DEBUG] share payload received", {
      shareText: sharedText,
      shareWebUrl: sharedWebUrl,
    });
    const candidate =
      (/^https?:\/\//i.test(sharedWebUrl) ? sharedWebUrl : undefined) ||
      extractFirstHttpUrl(sharedText) ||
      (/^https?:\/\//i.test(sharedText) ? sharedText : undefined);

    if (!candidate) {
      qaLog("SHARE", "navigation skipped", {
        sequence,
        reason: "no URL extracted from share intent",
      });
      console.log("[SHARE DEBUG] navigation skipped: no URL extracted from share intent");
      return;
    }
    if (lastHandledShareUrlRef.current === candidate) {
      qaLog("SHARE", "navigation skipped", {
        sequence,
        reason: "duplicate shared URL",
        candidate,
      });
      console.log("[SHARE DEBUG] navigation skipped: duplicate shared URL", {
        candidate,
      });
      return;
    }
    lastHandledShareUrlRef.current = candidate;

    qaLog("SHARE", "extracted URL", { sequence, url: candidate });
    console.log("[SHARE DEBUG] extracted URL", candidate);
    console.log("[share-intent] received payload", shareIntent);
    console.log("[share-intent] extracted url", candidate);
    console.log("[SHARE DEBUG] navigating to /add", {
      pathname: "/add",
      url: candidate,
    });
    qaLog("SHARE", "navigating to /add", {
      sequence,
      pathname: "/add",
      url: candidate,
    });

    router.replace({
      pathname: "/add",
      params: { url: candidate },
    });
    console.log("[SHARE DEBUG] share intent consumed/reset");
    qaLog("SHARE", "share intent cleared/reset", { sequence });
    resetShareIntent(true);
  }, [isHydrated, mode, hasShareIntent, shareIntent, resetShareIntent, router]);

  console.log("[AUTH DEBUG] layout navigation decision:", {
    isHydrated,
    hasUser,
    mode,
  });
  qaLog("AUTH", "navigation decision in layout", {
    isHydrated,
    hasUser,
    mode,
  });
  if (!isHydrated) {
    console.log("[AUTH DEBUG] navigation blocked until hydration complete");
    return null;
  }
  if (!hasUser) return <AuthScreenContent />;

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
      <Stack.Screen
        name="qa-debug"
        options={{
          title: "QA Debug Logs",
          presentation: "modal",
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
