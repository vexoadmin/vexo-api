import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

export function AuthScreenContent({
  onFinished,
}: {
  onFinished?: () => void;
}) {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    requestPasswordReset,
    updatePassword,
    isAuthenticating,
  } =
    useAuth();
  const [step, setStep] = useState<
    "welcome" | "signup" | "signin" | "resetPassword" | "emailConfirmed"
  >("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const handleAuthDeepLink = (url: string | null) => {
      if (!url) return;
      const lower = url.toLowerCase();
      if (lower.startsWith("vexo://auth/reset-password")) {
        setStep("resetPassword");
        setPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        setSuccessMessage("");
        return;
      }
      if (lower.startsWith("vexo://auth/confirmed")) {
        setStep("emailConfirmed");
        setPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        setSuccessMessage("");
      }
    };

    void Linking.getInitialURL().then((url) => {
      handleAuthDeepLink(url);
    });
  }, []);

  async function handleGoogleLogin() {
    setErrorMessage("");
    setSuccessMessage("");
    console.log("[AUTH DEBUG] Google login trigger start");
    try {
      const result = await signInWithGoogle();
      console.log("[AUTH DEBUG] Google login result:", result);
      if (!result.ok) {
        const message = result.reason || "Unable to sign in with Google.";
        setErrorMessage(message);
        Alert.alert("Google sign-in failed", message);
        return;
      }
      onFinished?.();
    } catch (error) {
      console.log("[AUTH DEBUG] Google login error object:", error);
      const message = "Unable to sign in with Google.";
      setErrorMessage(message);
      Alert.alert("Google sign-in failed", message);
    }
  }

  async function handleCreateAccount() {
    setErrorMessage("");
    setSuccessMessage("");
    const result = await signUpWithEmail(email, password);
    if (!result.ok) {
      setErrorMessage(result.reason || "Unable to create account.");
      return;
    }
    if (result.needsEmailConfirmation) {
      setSuccessMessage(
        "Account created. Check your email to confirm your account. After confirming, return to Vexo Save and sign in."
      );
      setPassword("");
      setStep("signin");
      return;
    }
    onFinished?.();
  }

  async function handleSignIn() {
    setErrorMessage("");
    setSuccessMessage("");
    const result = await signInWithEmail(email, password);
    if (!result.ok) {
      setErrorMessage(result.reason || "Unable to sign in.");
      return;
    }
    onFinished?.();
  }

  async function handleForgotPassword() {
    setErrorMessage("");
    setSuccessMessage("");
    if (!email.trim()) {
      setErrorMessage("Enter your email first.");
      return;
    }
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setErrorMessage(result.reason || "Unable to send password reset email.");
      return;
    }
    setSuccessMessage("Password reset email sent. Check your inbox.");
  }

  async function handleUpdatePassword() {
    setErrorMessage("");
    setSuccessMessage("");
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    const result = await updatePassword(password);
    if (!result.ok) {
      setErrorMessage(result.reason || "Unable to update password.");
      return;
    }
    setSuccessMessage("Password updated. You can now sign in.");
    setPassword("");
    setConfirmPassword("");
    setStep("signin");
  }

  function renderWelcome() {
    return (
      <>
        <Pressable
          onPress={handleGoogleLogin}
          disabled={isAuthenticating}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isAuthenticating ? { opacity: 0.9 } : null,
            isAuthenticating ? { opacity: 0.7 } : null,
          ]}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="log-in" size={17} color="#fff" />
                <Text style={styles.primaryBtnText}>Continue with Google</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            setStep("signup");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={({ pressed }) => [styles.secondaryBtn, pressed ? { opacity: 0.85 } : null]}
        >
          <Feather name="user-plus" size={16} color="#A5F3FC" />
          <Text style={styles.secondaryBtnText}>Create account</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setStep("signin");
            setErrorMessage("");
          }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Pressable>
      </>
    );
  }

  function renderEmailForm(mode: "signup" | "signin") {
    const isSignup = mode === "signup";
    return (
      <>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.30)"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.30)"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          onPress={isSignup ? handleCreateAccount : handleSignIn}
          disabled={isAuthenticating}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isAuthenticating ? { opacity: 0.9 } : null,
            isAuthenticating ? { opacity: 0.7 } : null,
          ]}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name={isSignup ? "user-plus" : "log-in"} size={17} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {isSignup ? "Create account" : "Sign in"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {!isSignup && (
          <Pressable
            onPress={handleGoogleLogin}
            style={({ pressed }) => [styles.secondaryBtn, pressed ? { opacity: 0.85 } : null]}
          >
            <Feather name="log-in" size={16} color="#A5F3FC" />
            <Text style={styles.secondaryBtnText}>Continue with Google</Text>
          </Pressable>
        )}

        {!isSignup && (
          <Pressable onPress={handleForgotPassword} style={styles.linkBtn}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            setStep(isSignup ? "signin" : "signup");
            setErrorMessage("");
          }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>
            {isSignup ? "Already have an account? Sign in" : "Need an account? Create one"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setStep("welcome");
            setErrorMessage("");
          }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Back</Text>
        </Pressable>
      </>
    );
  }

  function renderResetPasswordForm() {
    return (
      <>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor="rgba(255,255,255,0.30)"
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="rgba(255,255,255,0.30)"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          onPress={handleUpdatePassword}
          disabled={isAuthenticating}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isAuthenticating ? { opacity: 0.9 } : null,
            isAuthenticating ? { opacity: 0.7 } : null,
          ]}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check" size={17} color="#fff" />
                <Text style={styles.primaryBtnText}>Update password</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            setStep("signin");
            setErrorMessage("");
          }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </>
    );
  }

  function renderEmailConfirmed() {
    return (
      <>
        <View style={styles.confirmedWrap}>
          <Feather name="check-circle" size={34} color="#34D399" />
          <Text style={styles.confirmedTitle}>Email confirmed</Text>
          <Text style={styles.confirmedSub}>You can now sign in to Vexo Save</Text>
        </View>
        <Pressable
          onPress={() => {
            setStep("signin");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isAuthenticating ? { opacity: 0.9 } : null,
          ]}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            <Feather name="log-in" size={17} color="#fff" />
            <Text style={styles.primaryBtnText}>Go to sign in</Text>
          </LinearGradient>
        </Pressable>
      </>
    );
  }

  return (
    <LinearGradient
      colors={["#060814", "#0A1022", "#121630"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Image
            source={require("../assets/images/vexo-logo-muted-cropped.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Vexo Save</Text>
        <Text style={styles.subtitle}>
          Save links, organize them, and sync across your devices.
        </Text>

        <View style={styles.actions}>
          {step === "welcome" && renderWelcome()}
          {step === "signup" && renderEmailForm("signup")}
          {step === "signin" && renderEmailForm("signin")}
          {step === "resetPassword" && renderResetPasswordForm()}
          {step === "emailConfirmed" && renderEmailConfirmed()}
        </View>

        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    </LinearGradient>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  return <AuthScreenContent onFinished={() => router.replace("/(tabs)")} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 999,
    top: -50,
    right: -50,
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  glowBottom: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 999,
    bottom: -80,
    left: -70,
    backgroundColor: "rgba(120,96,218,0.10)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  logoArea: {
    width: 210,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    marginBottom: 20,
  },
  actions: {
    width: "100%",
    marginTop: 22,
    gap: 12,
  },
  logo: {
    width: 210,
    height: 110,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    textAlign: "center",
    maxWidth: 320,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  primaryBtnInner: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  secondaryBtnText: {
    color: "#A5F3FC",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  linkText: {
    color: "#A5F3FC",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  errorText: {
    color: "#F87171",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 12,
  },
  successText: {
    color: "#34D399",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 12,
  },
  confirmedWrap: {
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  confirmedTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  confirmedSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
