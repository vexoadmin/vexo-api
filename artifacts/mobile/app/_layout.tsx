import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useShareIntent } from "expo-share-intent";
import { Stack, useRouter } from "expo-router";
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
let shareDeepLinkListenerRegistered = false;
let shareDeepLinkSubscription: { remove: () => void } | null = null;

function RootLayoutNav() {
  const colors = useColors();
  const { mode, isHydrated, user } = useAuth();
  const hasUser = !!user;
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const lastHandledShareUrlRef = useRef<string | null>(null);
  const isHydratedRef = useRef(isHydrated);
  const modeRef = useRef(mode);
  const routerRef = useRef(router);
  const pendingDeepLinkRef = useRef<string | null>(null);
  const deepLinkRunRef = useRef<(incoming: string | null) => void>(() => {});
  const shareIntentPackRef = useRef({
    hasShareIntent,
    shareIntent,
    resetShareIntent,
  });

  useEffect(() => {
    isHydratedRef.current = isHydrated;
    modeRef.current = mode;
    routerRef.current = router;
  }, [isHydrated, mode, router]);

  useEffect(() => {
    shareIntentPackRef.current = {
      hasShareIntent,
      shareIntent,
      resetShareIntent,
    };
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  const shareIntentFingerprint = `${shareIntent?.text ?? ""}\u001f${shareIntent?.webUrl ?? ""}`;

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
    if (shareDeepLinkListenerRegistered) {
      return;
    }
    shareDeepLinkListenerRegistered = true;
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
      const hydrated = isHydratedRef.current;
      const modeVal = modeRef.current;
      const router = routerRef.current;

      if (!hydrated || modeVal === null) {
        if (incoming) {
          const lower = incoming.toLowerCase();
          if (!lower.startsWith("vexo://auth")) {
            pendingDeepLinkRef.current = incoming;
            qaLog("SHARE", "deep link route deferred", {
              reason: !hydrated ? "not hydrated" : "mode is null",
            });
            console.log("[SHARE DEBUG] deep link route deferred", {
              reason: !hydrated ? "not hydrated" : "mode is null",
            });
          }
        }
        return;
      }

      if (!incoming) {
        return;
      }

      let candidate: string | undefined;
      const trimmed = incoming.trim();
      if (trimmed.toLowerCase().startsWith("vexo://auth")) {
        return;
      }

      const sequence = nextQaSequence("SHARE");
      qaLog("SHARE", "share payload received", {
        sequence,
        source: "linking",
        length: trimmed.length,
      });
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

      router.push({
        pathname: "/add",
        params: { url: candidate },
      });
    };

    deepLinkRunRef.current = routeToAddFromIncoming;

    qaLog("SHARE", "listener added", {});
    console.log("[SHARE DEBUG] deep link listener attached (once, app lifecycle)");
    void Linking.getInitialURL()
      .then((initialUrl) => {
        console.log("[SHARE DEBUG] Linking.getInitialURL result", { initialUrl });
        console.log("[share] layout initial url", initialUrl);
        deepLinkRunRef.current(initialUrl);
      })
      .catch(() => undefined);

    shareDeepLinkSubscription = Linking.addEventListener("url", ({ url }) => {
      console.log("[SHARE DEBUG] Linking url event received", { url });
      console.log("[share] layout initial url", url);
      deepLinkRunRef.current(url);
    });

  }, []);

  useEffect(() => {
    if (!isHydrated || mode === null) return;
    const pending = pendingDeepLinkRef.current;
    if (!pending) return;
    pendingDeepLinkRef.current = null;
    deepLinkRunRef.current(pending);
  }, [isHydrated, mode]);

  useEffect(() => {
    if (!hasShareIntent || !isHydrated || mode === null) return;

    const extractFirstHttpUrl = (text: string): string | undefined => {
      const match = text.match(/https?:\/\/[^\s<>"')\]}]+/i);
      if (!match?.[0]) return undefined;
      return match[0].replace(/[),.;!?]+$/, "");
    };

    const pack = shareIntentPackRef.current;
    const sharedText = (pack.shareIntent?.text || "").trim();
    const sharedWebUrl = (pack.shareIntent?.webUrl || "").trim();
    const sequence = nextQaSequence("SHARE");
    qaLog("SHARE", "share payload received", {
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
    console.log("[share-intent] received payload", pack.shareIntent);
    console.log("[share-intent] extracted url", candidate);

    qaLog("SHARE", "navigating to /add", {
      sequence,
      pathname: "/add",
      url: candidate,
    });
    console.log("[SHARE DEBUG] navigating to /add", {
      pathname: "/add",
      url: candidate,
    });

    routerRef.current.push({
      pathname: "/add",
      params: { url: candidate },
    });

    qaLog("SHARE", "intent cleared", { sequence });
    console.log("[SHARE DEBUG] share intent consumed/reset");
    pack.resetShareIntent(true);
  }, [isHydrated, mode, hasShareIntent, shareIntentFingerprint]);

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
