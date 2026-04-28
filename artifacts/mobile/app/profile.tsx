import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";
const SUPPORT_EMAIL = "support@vexoapps.com";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.name || "");
  }, [profile?.name]);

  async function saveDisplayName() {
    const nextName = displayName.trim();
    if (!profile?.id || !nextName) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: nextName })
        .eq("id", profile.id);
      if (error) {
        Alert.alert("Unable to save", error.message);
        return;
      }
      Alert.alert("Saved", "Display name updated.");
    } finally {
      setSavingName(false);
    }
  }

  function confirmDeleteAccountData() {
    if (!profile?.id || deletingData) return;
    Alert.alert(
      "Delete account data",
      "Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteAccountData();
          },
        },
      ],
    );
  }

  async function deleteAccountData() {
    if (!profile?.id) return;
    setDeletingData(true);
    try {
      await supabase.from("saved_items").delete().eq("user_id", profile.id);
      await supabase.from("categories").delete().eq("user_id", profile.id);
      await supabase.from("profiles").delete().eq("id", profile.id);
      await signOut();
      Alert.alert(
        "Data deleted",
        "Your data has been deleted. To fully remove your login account, contact support@vexoapps.com",
        [
          {
            text: "Contact support",
            onPress: () => {
              void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
            },
          },
          {
            text: "OK",
            style: "default",
            onPress: () => router.replace("/auth"),
          },
        ],
      );
    } finally {
      setDeletingData(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#031020", "#051120", "#040812"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>USER INFO</Text>
          <View style={styles.card}>
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={22} color="#A5F3FC" />
            </View>
            <Text style={styles.emailText}>{profile?.email || "Not signed in"}</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor="rgba(255,255,255,0.30)"
              style={styles.input}
              editable={Boolean(profile?.id)}
            />
            <Pressable
              onPress={saveDisplayName}
              disabled={!profile?.id || savingName}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed ? { opacity: 0.9 } : null,
                !profile?.id || savingName ? { opacity: 0.6 } : null,
              ]}
            >
              <LinearGradient
                colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText}>
                  {savingName ? "Saving..." : "Save name"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIONS</Text>
          <View style={styles.card}>
            <Pressable onPress={() => void signOut()} style={styles.actionRow}>
              <Feather name="log-out" size={18} color="#A5F3FC" />
              <Text style={styles.actionText}>Logout</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={confirmDeleteAccountData}
              disabled={!profile?.id || deletingData}
              style={styles.actionRow}
            >
              <Feather name="trash-2" size={18} color="#F87171" />
              <Text style={styles.deleteText}>
                {deletingData ? "Deleting..." : "Delete account"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, gap: 16 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.30)",
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  emailText: {
    color: "rgba(255,255,255,0.78)",
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
  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryBtnInner: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  actionText: {
    color: "#A5F3FC",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  deleteText: {
    color: "#F87171",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
});
