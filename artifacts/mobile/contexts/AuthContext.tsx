import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { normalizeAuthHashToQueryForParse } from "@/utils/authDeepLinkUrl";
import { qaLog } from "@/utils/qaDebugLog";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "authenticated" | null;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type AuthActionResult = {
  ok: boolean;
  reason?: string;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  mode: AuthMode;
  user: User | null;
  profile: AuthUser | null;
  session: Session | null;
  isHydrated: boolean;
  isAuthenticating: boolean;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthActionResult>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
};

const GUEST_KEY = "@vexo_guest_mode_v1";
const AuthContext = createContext<AuthContextValue | null>(null);
const GOOGLE_CONFLICT_MESSAGE =
  "This email may already be registered with email and password. Please sign in with email/password, or reset your password.";
const GOOGLE_SIGNIN_INCOMPLETE =
  "Google sign-in could not be completed. Please try again.";
let authDeepLinkListenerRegistered = false;
let authDeepLinkInitialUrlHandled = false;
let authDeepLinkSubscription: { remove: () => void } | null = null;

function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) return {};
  const hash = url.slice(hashIndex + 1);
  const params = new URLSearchParams(hash);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function parseAuthTokens(url?: string, params?: Record<string, string>) {
  const tokenParams = params || {};
  if (tokenParams["access_token"]) {
    return {
      accessToken: tokenParams["access_token"],
      refreshToken: tokenParams["refresh_token"],
    };
  }

  if (!url) return {};
  const hashParams = parseHashParams(url);
  return {
    accessToken: hashParams["access_token"],
    refreshToken: hashParams["refresh_token"],
  };
}

function parseQueryParams(url?: string): Record<string, string> {
  if (!url) return {};
  const queryIndex = url.indexOf("?");
  if (queryIndex < 0) return {};
  const hashIndex = url.indexOf("#");
  const query =
    hashIndex > queryIndex
      ? url.slice(queryIndex + 1, hashIndex)
      : url.slice(queryIndex + 1);
  const search = new URLSearchParams(query);
  const out: Record<string, string> = {};
  search.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function isDuplicateEmailError(error: unknown): boolean {
  const record = (error || {}) as Record<string, unknown>;
  const code = String(record["code"] || "").toLowerCase();
  const message = String(record["message"] || "").toLowerCase();
  const text = `${code} ${message}`;
  return (
    text.includes("user already registered") ||
    text.includes("already registered") ||
    text.includes("already exists") ||
    text.includes("email_exists") ||
    text.includes("user_already_exists")
  );
}

function isEmailNotConfirmedError(error: unknown): boolean {
  const record = (error || {}) as Record<string, unknown>;
  const code = String(record["code"] || "").toLowerCase();
  const message = String(record["message"] || "").toLowerCase();
  const text = `${code} ${message}`;
  return text.includes("email not confirmed") || text.includes("email_not_confirmed");
}

function isGoogleIdentityConflictError(error: unknown): boolean {
  const record = (error || {}) as Record<string, unknown>;
  const code = String(record["code"] || "").toLowerCase();
  const message = String(record["message"] || "").toLowerCase();
  const text = `${code} ${message}`;
  return (
    (text.includes("identity") && text.includes("already")) ||
    text.includes("identity_already_exists") ||
    text.includes("email_exists") ||
    text.includes("account exists") ||
    text.includes("account_exists") ||
    text.includes("already registered")
  );
}

function normalizeGoogleAuthErrorReason(error: unknown, fallback?: string): string {
  if (isGoogleIdentityConflictError(error)) return GOOGLE_CONFLICT_MESSAGE;
  if (fallback) return fallback;
  return GOOGLE_SIGNIN_INCOMPLETE;
}

async function fetchGoogleUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.sub || !data?.email) return null;

    return {
      id: String(data.sub),
      email: String(data.email),
      name: String(data.name || data.email),
      avatarUrl: typeof data.picture === "string" ? data.picture : undefined,
    };
  } catch {
    return null;
  }
}

async function ensureProfileRow(profile: AuthUser) {
  try {
    await supabase.from("profiles").upsert(
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatarUrl ?? null,
      },
      { onConflict: "id" },
    );
  } catch {
    // non-blocking for beta
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  async function setSessionFromResetUrl(url: string): Promise<void> {
    const normalized = normalizeAuthHashToQueryForParse(url);
    const queryParams = parseQueryParams(normalized);
    const { accessToken, refreshToken } = parseAuthTokens(normalized, queryParams);
    if (!accessToken || !refreshToken) return;
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async function finalizeSessionFromUrl(rawUrl: string): Promise<AuthActionResult> {
    const url = normalizeAuthHashToQueryForParse(rawUrl);
    const lowerUrl = url.toLowerCase();
    const isAuthCallback = lowerUrl.startsWith("vexo://auth");
    console.log("[GOOGLE DEBUG] finalizeSessionFromUrl received url:", url);
    console.log("[GOOGLE DEBUG] finalizeSessionFromUrl startsWith:", {
      vexoAuth: lowerUrl.startsWith("vexo://auth"),
      exp: url.toLowerCase().startsWith("exp://"),
    });
    console.log("OAuth handler received url:", url);
    console.log("OAuth handler is auth callback:", isAuthCallback);
    if (!isAuthCallback) {
      return { ok: false, reason: "Ignored non-auth callback URL." };
    }

    const queryParams = parseQueryParams(url);
    const tokenFromQuery = parseAuthTokens(url, queryParams);
    const code = queryParams["code"];
    qaLog("AUTH", "auth callback parsed", {
      hasAccessToken: !!(tokenFromQuery.accessToken || queryParams["access_token"]),
      hasCode: !!code,
    });
    console.log("[GOOGLE DEBUG] finalizeSessionFromUrl parsed code exists:", !!code);
    console.log("OAuth handler parsed code:", code ?? null);
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      console.log("[GOOGLE DEBUG] exchangeCodeForSession result:", {
        success: !exchangeError,
        error: exchangeError ?? null,
      });
      console.log("OAuth handler exchangeCodeForSession error:", exchangeError ?? null);
      if (exchangeError) {
        console.log("[AUTH GOOGLE] exchange code failed:", exchangeError);
        return {
          ok: false,
          reason: normalizeGoogleAuthErrorReason(exchangeError, GOOGLE_SIGNIN_INCOMPLETE),
        };
      }
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[GOOGLE DEBUG] getSession after exchange:", {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id ?? null,
        email: sessionData.session?.user?.email ?? null,
      });
      console.log("OAuth handler getSession after exchange:", sessionData);
      const activeSession = sessionData.session;
      if (activeSession?.user) {
        await ensureProfileRow({
          id: activeSession.user.id,
          email: activeSession.user.email ?? "",
          name:
            (activeSession.user.user_metadata?.full_name as string | undefined) ||
            (activeSession.user.user_metadata?.name as string | undefined) ||
            activeSession.user.email ||
            "Vexo User",
          avatarUrl: activeSession.user.user_metadata?.avatar_url as
            | string
            | undefined,
        });
      }
      await AsyncStorage.setItem(GUEST_KEY, "0");
      return { ok: true };
    }

    const { accessToken, refreshToken } = parseAuthTokens(url, undefined);
    if (!accessToken || !refreshToken) {
      console.log("[AUTH GOOGLE] callback missing session tokens", { url });
      return {
        ok: false,
        reason: normalizeGoogleAuthErrorReason(
          { message: "OAuth callback missing required session tokens." },
          GOOGLE_SIGNIN_INCOMPLETE,
        ),
      };
    }

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setSessionError) {
      console.log("[AUTH GOOGLE] setSession failed:", setSessionError);
      return {
        ok: false,
        reason: normalizeGoogleAuthErrorReason(setSessionError, GOOGLE_SIGNIN_INCOMPLETE),
      };
    }

    const googleUser = await fetchGoogleUser(accessToken);
    if (googleUser) {
      await ensureProfileRow(googleUser);
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeSession = sessionData.session;
      if (activeSession?.user) {
        await ensureProfileRow({
          id: activeSession.user.id,
          email: activeSession.user.email ?? "",
          name:
            (activeSession.user.user_metadata?.full_name as string | undefined) ||
            (activeSession.user.user_metadata?.name as string | undefined) ||
            activeSession.user.email ||
            "Vexo User",
          avatarUrl: activeSession.user.user_metadata?.avatar_url as
            | string
            | undefined,
        });
      }
    }

    await AsyncStorage.setItem(GUEST_KEY, "0");
    return { ok: true };
  }

  useEffect(() => {
    (async () => {
      try {
        console.log("[AUTH DEBUG] getSession start");
        qaLog("AUTH", "getSession start");
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("[AUTH DEBUG] getSession result:", {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id ?? null,
          email: sessionData.session?.user?.email ?? null,
        });
        qaLog("AUTH", "getSession result", {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id ?? null,
          email: sessionData.session?.user?.email ?? null,
        });

        const activeSession = sessionData.session;
        if (activeSession?.user) {
          userRef.current = activeSession.user;
          setSession(activeSession);
          console.log("[AUTH DEBUG] user state set:", {
            userId: activeSession.user.id,
            email: activeSession.user.email ?? null,
          });
          qaLog("AUTH", "user set from getSession", {
            userId: activeSession.user.id,
            email: activeSession.user.email ?? null,
          });
          setUser(activeSession.user);
          setProfile({
            id: activeSession.user.id,
            email: activeSession.user.email ?? "",
            name:
              (activeSession.user.user_metadata?.full_name as string | undefined) ||
              (activeSession.user.user_metadata?.name as string | undefined) ||
              activeSession.user.email ||
              "Vexo User",
            avatarUrl: activeSession.user.user_metadata?.avatar_url as
              | string
              | undefined,
          });
          setMode("authenticated");
        } else if (!userRef.current) {
          console.log("[AUTH DEBUG] user state cleared (no active session)");
          qaLog("AUTH", "user cleared (no active session)");
          userRef.current = null;
          setMode(null);
          setUser(null);
          setProfile(null);
          setSession(null);
        } else {
          qaLog("AUTH", "session preserved", { hasUser: true });
        }
      } catch {
        console.log("[AUTH DEBUG] getSession threw error");
        if (!userRef.current) {
          console.log("[AUTH DEBUG] user state cleared (getSession error)");
          qaLog("AUTH", "getSession error: user cleared");
          userRef.current = null;
          setMode(null);
          setUser(null);
          setProfile(null);
          setSession(null);
        } else {
          qaLog("AUTH", "session preserved", { hasUser: true });
        }
      } finally {
        setIsHydrated(true);
        console.log("[AUTH DEBUG] auth loading false (isHydrated=true)");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("[AUTH DEBUG] onAuthStateChange:", {
        event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
        email: nextSession?.user?.email ?? null,
      });
      qaLog("AUTH", "onAuthStateChange event", {
        event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
        email: nextSession?.user?.email ?? null,
      });

      if (event === "SIGNED_OUT") {
        console.log("[AUTH DEBUG] user state cleared (SIGNED_OUT)");
        qaLog("AUTH", "user cleared (SIGNED_OUT)");
        userRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setMode(null);
        return;
      }

      if (nextSession?.user) {
        userRef.current = nextSession.user;
        setSession(nextSession);
        const nextProfile: AuthUser = {
          id: nextSession.user.id,
          email: nextSession.user.email ?? "",
          name:
            (nextSession.user.user_metadata?.full_name as string | undefined) ||
            (nextSession.user.user_metadata?.name as string | undefined) ||
            nextSession.user.email ||
            "Vexo User",
          avatarUrl: nextSession.user.user_metadata?.avatar_url as
            | string
            | undefined,
        };
        console.log("[AUTH DEBUG] user state set:", {
          userId: nextSession.user.id,
          email: nextSession.user.email ?? null,
        });
        qaLog("AUTH", "user set from onAuthStateChange", {
          userId: nextSession.user.id,
          email: nextSession.user.email ?? null,
        });
        setUser(nextSession.user);
        setProfile(nextProfile);
        setMode("authenticated");
        void AsyncStorage.setItem(GUEST_KEY, "0");
        void ensureProfileRow(nextProfile);
        qaLog("AUTH", "session preserved", { hasUser: true });
        return;
      }

      // Spurious null session (e.g. transient events): do not clear signed-in user.
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authDeepLinkListenerRegistered) {
      return;
    }
    authDeepLinkListenerRegistered = true;
    console.log("[AUTH DEBUG] deep link listener added");
    const handleIncomingUrl = async (url: string) => {
      console.log("[AUTH DEBUG] deep link received", {
        length: url?.length ?? 0,
        isVexoAuth: url.toLowerCase().startsWith("vexo://auth"),
      });
      const lowerUrl = url.toLowerCase();
      if (!lowerUrl.startsWith("vexo://auth")) return;
      if (lowerUrl.startsWith("vexo://auth/reset-password")) {
        try {
          await setSessionFromResetUrl(url);
        } catch {
          // keep reset flow resilient
        }
        return;
      }
      try {
        await finalizeSessionFromUrl(url);
        console.log("[AUTH DEBUG] auth callback handled");
      } catch (error) {
        console.log("[AUTH GOOGLE] callback finalize exception:", error);
      }
    };

    authDeepLinkSubscription = Linking.addEventListener("url", (event) => {
      console.log("[GOOGLE DEBUG] Linking url event:", event.url);
      console.log("[AUTH DEBUG] Linking url event:", event.url);
      void handleIncomingUrl(event.url);
    });

    if (!authDeepLinkInitialUrlHandled) {
      authDeepLinkInitialUrlHandled = true;
      void Linking.getInitialURL().then((initialUrl) => {
        console.log("[GOOGLE DEBUG] initial URL:", initialUrl);
        console.log("[AUTH DEBUG] initial URL:", initialUrl);
        if (initialUrl) {
          void handleIncomingUrl(initialUrl);
        }
      });
    }

  }, []);

  async function waitForSessionAfterOAuth(timeoutMs = 20000): Promise<boolean> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session?.user;
      qaLog("AUTH", "oauth wait session tick", { hasSession });
      if (hasSession) {
        qaLog("AUTH", "oauth wait session resolved", { hasSession: true });
        return true;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    qaLog("AUTH", "oauth wait session resolved", { hasSession: false });
    return false;
  }

  async function signInWithGoogle(): Promise<AuthActionResult> {
    setIsAuthenticating(true);
    try {
      const redirectTo = "vexo://auth";
      console.log("[GOOGLE DEBUG] before signInWithOAuth");
      console.log("[AUTH DEBUG] redirectTo computed:", redirectTo);
      console.log("Google OAuth redirectTo:", redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      console.log("[GOOGLE DEBUG] after signInWithOAuth:", {
        hasUrl: !!data?.url,
        hasError: !!error,
      });
      console.log("Google OAuth data.url:", data?.url);

      if (error || !data?.url) {
        console.log("[AUTH GOOGLE] signInWithOAuth failed:", error || "missing data.url");
        return {
          ok: false,
          reason: normalizeGoogleAuthErrorReason(
            error || { message: "Failed to start Google sign-in." },
            "Google sign-in could not be started.",
          ),
        };
      }

      console.log("[GOOGLE DEBUG] before opening browser/url");
      const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      const browserResultHasUrl =
        "url" in browserResult &&
        typeof browserResult.url === "string" &&
        browserResult.url.length > 0;
      console.log("[GOOGLE DEBUG] after browser/url returns:", {
        type: browserResult.type,
        hasUrl: browserResultHasUrl,
      });
      console.log("[AUTH DEBUG] openAuthSessionAsync result:", browserResult);
      if (browserResult.type === "success" && browserResult.url) {
        return await finalizeSessionFromUrl(browserResult.url);
      }
      if (browserResult.type === "cancel") {
        return {
          ok: false,
          reason: "Google sign-in was cancelled.",
        };
      }

      qaLog("AUTH", "oauth browser returned without callback - checking session", {
        type: browserResult.type,
      });
      const recovered = await waitForSessionAfterOAuth(20000);
      if (recovered) {
        const { data: postBrowserSession } = await supabase.auth.getSession();
        const session = postBrowserSession.session;
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          userRef.current = session.user;
          setMode("authenticated");
          const nextProfile: AuthUser = {
            id: session.user.id,
            email: session.user.email ?? "",
            name:
              (session.user.user_metadata?.full_name as string | undefined) ||
              (session.user.user_metadata?.name as string | undefined) ||
              session.user.email ||
              "Vexo User",
            avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
          };
          setProfile(nextProfile);
        }
        await AsyncStorage.setItem(GUEST_KEY, "0");
        return { ok: true };
      }

      return {
        ok: false,
        reason: "Google sign-in did not return a callback URL.",
      };

    } catch (error) {
      console.log("[AUTH GOOGLE] unexpected sign-in exception:", error);
      return {
        ok: false,
        reason: normalizeGoogleAuthErrorReason(error, GOOGLE_SIGNIN_INCOMPLETE),
      };
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signUpWithEmail(
    email: string,
    password: string,
  ): Promise<AuthActionResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      return { ok: false, reason: "Use a valid email and password (6+ chars)." };
    }

    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: "vexo://auth/confirmed",
        },
      });
      if (error) {
        if (isDuplicateEmailError(error)) {
          return {
            ok: false,
            reason: "This email is already registered. Please sign in instead.",
          };
        }
        return { ok: false, reason: error.message };
      }

      const nextUser = data.user;
      if (nextUser) {
        const nextProfile: AuthUser = {
          id: nextUser.id,
          email: nextUser.email ?? cleanEmail,
          name:
            (nextUser.user_metadata?.full_name as string | undefined) ||
            (nextUser.user_metadata?.name as string | undefined) ||
            cleanEmail.split("@")[0] ||
            "Vexo User",
          avatarUrl: nextUser.user_metadata?.avatar_url as string | undefined,
        };
        await ensureProfileRow(nextProfile);
        setProfile(nextProfile);
      }

      await AsyncStorage.setItem(GUEST_KEY, "0");
      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true };
      }
      return { ok: true };
    } catch {
      return { ok: false, reason: "Unable to create account. Try again." };
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signInWithEmail(
    email: string,
    password: string,
  ): Promise<AuthActionResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { ok: false, reason: "Email and password are required." };
    }

    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        if (isEmailNotConfirmedError(error)) {
          return { ok: false, reason: "Please confirm your email before signing in." };
        }
        return { ok: false, reason: error.message };
      }

      const nextUser = data.user;
      if (nextUser) {
        const nextProfile: AuthUser = {
          id: nextUser.id,
          email: nextUser.email ?? cleanEmail,
          name:
            (nextUser.user_metadata?.full_name as string | undefined) ||
            (nextUser.user_metadata?.name as string | undefined) ||
            cleanEmail.split("@")[0] ||
            "Vexo User",
          avatarUrl: nextUser.user_metadata?.avatar_url as string | undefined,
        };
        await ensureProfileRow(nextProfile);
      }

      await AsyncStorage.setItem(GUEST_KEY, "0");
      return { ok: true };
    } catch {
      return { ok: false, reason: "Unable to sign in. Try again." };
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function requestPasswordReset(email: string): Promise<AuthActionResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, reason: "Enter your email first." };
    }
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: "vexo://auth/reset-password",
      });
      if (error) return { ok: false, reason: error.message };
      return { ok: true };
    } catch {
      return { ok: false, reason: "Unable to send reset email. Try again." };
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function updatePassword(newPassword: string): Promise<AuthActionResult> {
    if (newPassword.length < 6) {
      return { ok: false, reason: "Password must be at least 6 characters." };
    }
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, reason: error.message };
      return { ok: true };
    } catch {
      return { ok: false, reason: "Unable to update password. Try again." };
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    userRef.current = null;
    setMode(null);
    setUser(null);
    setProfile(null);
    setSession(null);
    await AsyncStorage.setItem(GUEST_KEY, "0");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      user,
      profile,
      session,
      isHydrated,
      isAuthenticating,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [mode, user, profile, session, isHydrated, isAuthenticating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
