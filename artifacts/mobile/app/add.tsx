import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

const GRADIENT_COLORS = [
  "#8B5CF6", "#6366F1", "#3B82F6", "#06B6D4",
  "#7C3AED", "#2563EB", "#0891B2", "#4F46E5",
];

function detectPlatform(url: string): "youtube" | "tiktok" | "instagram" | null {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  return null;
}

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, addItem } = useSavedItems();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || "");
  const [notes, setNotes] = useState("");

  const detectedPlatform = detectPlatform(url);

  function handleSave() {
    if (!url.trim()) {
      Alert.alert("Missing URL", "Please enter a video link");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title");
      return;
    }
    if (!detectedPlatform) {
      Alert.alert("Invalid Link", "Please enter a YouTube, TikTok, or Instagram link");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      url: url.trim(),
      title: title.trim(),
      platform: detectedPlatform,
      category: selectedCategory,
      notes: notes.trim(),
      thumbnailColor: GRADIENT_COLORS[Math.floor(Math.random() * GRADIENT_COLORS.length)],
    });
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Video Link</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.secondary, borderRadius: 14, borderColor: colors.border, borderWidth: 1 }]}>
            <Feather name="link" size={18} color={colors.mutedForeground} />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste YouTube, TikTok, or Instagram link"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          {detectedPlatform && (
            <View style={[styles.platformDetected, { backgroundColor: colors.primary + "22" }]}>
              <Feather
                name={detectedPlatform === "youtube" ? "youtube" : detectedPlatform === "instagram" ? "instagram" : "music"}
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.platformText, { color: colors.primary }]}>
                {detectedPlatform === "youtube" ? "YouTube" : detectedPlatform === "instagram" ? "Instagram" : "TikTok"} detected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(cat.name);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === cat.name ? cat.color + "33" : colors.secondary,
                      borderColor: selectedCategory === cat.name ? cat.color : colors.border,
                    },
                  ]}
                >
                  <Feather name={cat.icon as any} size={14} color={selectedCategory === cat.name ? cat.color : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedCategory === cat.name ? cat.color : colors.mutedForeground },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add your notes..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <LinearGradient
            colors={["#8B5CF6", "#6366F1", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Video</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderRadius: 14,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 100,
  },
  platformDetected: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  platformText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
