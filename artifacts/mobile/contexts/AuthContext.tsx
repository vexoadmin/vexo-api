import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

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
  const oauthPendingRef = useRef<{
    resolve: (result: AuthActionResult) => void;
  } | null>(null);

  async function setSessionFromResetUrl(url: string): Promise<void> {
    const queryParams = parseQueryParams(url);
    const { accessToken, refreshToken } = parseAuthTokens(url, queryParams);
    if (!accessToken || !refreshToken) return;
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async function finalizeSessionFromUrl(url: string): Promise<AuthActionResult> {
    console.log("OAuth handler received url:", url);
    console.log(
      "OAuth handler startsWith vexo://auth:",
      url.toLowerCase().startsWith("vexo://auth"),
    );
    if (!url.toLowerCase().startsWith("vexo://auth")) {
      return { ok: false, reason: "Ignored non-auth callback URL." };
    }

    const queryParams = parseQueryParams(url);
    const code = queryParams["code"];
    console.log("OAuth handler parsed code:", code ?? null);
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      console.log("OAuth handler exchangeCodeForSession error:", exchangeError ?? null);
      if (exchangeError) {
        return { ok: false, reason: exchangeError.message };
      }
      const { data: sessionData } = await supabase.auth.getSession();
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
      return { ok: false, reason: "OAuth callback missing required session tokens." };
    }

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setSessionError) {
      return { ok: false, reason: setSessionError.message };
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
        const { data: sessionData } = await supabase.auth.getSession();

        const activeSession = sessionData.session;
        if (activeSession?.user) {
          setSession(activeSession);
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
        } else {
          setMode(null);
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } catch {
        setMode(null);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setIsHydrated(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
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
        setUser(nextSession.user);
        setProfile(nextProfile);
        setMode("authenticated");
        void AsyncStorage.setItem(GUEST_KEY, "0");
        void ensureProfileRow(nextProfile);
      } else {
        setUser(null);
        setProfile(null);
        setMode(null);
        setSession(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleIncomingUrl = async (url: string) => {
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
        const result = await finalizeSessionFromUrl(url);
        if (oauthPendingRef.current) {
          oauthPendingRef.current.resolve(result);
          oauthPendingRef.current = null;
        }
      } catch (error) {
        if (oauthPendingRef.current) {
          oauthPendingRef.current.resolve({
            ok: false,
            reason: "Failed to finalize Google sign-in.",
          });
          oauthPendingRef.current = null;
        }
      }
    };

    const sub = Linking.addEventListener("url", (event) => {
      void handleIncomingUrl(event.url);
    });

    void Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        void handleIncomingUrl(initialUrl);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  async function signInWithGoogle(): Promise<AuthActionResult> {
    setIsAuthenticating(true);
    try {
      const redirectTo = "vexo://auth";
      console.log("Google OAuth redirectTo:", redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      console.log("Google OAuth data.url:", data?.url);

      if (error || !data?.url) {
        return { ok: false, reason: error?.message || "Failed to start Google sign-in." };
      }

      await WebBrowser.dismissBrowser();
      await Linking.openURL(data.url);

      const completion = new Promise<AuthActionResult>((resolve) => {
        oauthPendingRef.current = { resolve };
      });
      const timeout = new Promise<AuthActionResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: false,
              reason: "Google sign-in timed out. Please try again.",
            }),
          120000,
        ),
      );
      return await Promise.race([completion, timeout]);

    } catch {
      return { ok: false, reason: "Google sign-in failed. Try again." };
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
