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
import DateTimePicker from "@react-native-community/datetimepicker";

import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

const GRADIENT_COLORS = [
  "#8B5CF6", "#6366F1", "#3B82F6", "#06B6D4",
  "#F97316", "#EC4899", "#10B981", "#F59E0B",
];

function detectPlatform(url: string): "youtube" | "tiktok" | "instagram" | null {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  return null;
}

const REMINDER_OPTIONS = [
  { label: "Tomorrow", getValue: () => Date.now() + 86400000 },
  { label: "Weekend", getValue: () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    return Date.now() + daysUntilSat * 86400000;
  }},
  { label: "Next Week", getValue: () => Date.now() + 7 * 86400000 },
];

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, addItem } = useSavedItems();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || "");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<number | undefined>(undefined);
  const [showCustomDate, setShowCustomDate] = useState(false);

  const detectedPlatform = detectPlatform(url);
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;

  function handleSave() {
    if (!url.trim()) { Alert.alert("Missing URL", "Please enter a video link"); return; }
    if (!title.trim()) { Alert.alert("Missing Title", "Please enter a title"); return; }
    if (!detectedPlatform) { Alert.alert("Invalid Link", "Please enter a YouTube, TikTok, or Instagram link"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      url: url.trim(),
      title: title.trim(),
      platform: detectedPlatform,
      category: selectedCategory,
      notes: notes.trim(),
      thumbnailColor: GRADIENT_COLORS[Math.floor(Math.random() * GRADIENT_COLORS.length)],
      reminder,
    });
    router.back();
  }

  function formatReminder(ts: number) {
    return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>VIDEO LINK</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.secondary, borderColor: detectedPlatform ? "#8B5CF6" + "66" : colors.border }]}>
            <Feather name="link-2" size={16} color={detectedPlatform ? colors.primary : colors.mutedForeground} />
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
            <View style={[styles.detected, { backgroundColor: "#8B5CF6" + "15" }]}>
              <Feather
                name={detectedPlatform === "youtube" ? "youtube" : detectedPlatform === "instagram" ? "instagram" : "music"}
                size={12}
                color={colors.primary}
              />
              <Text style={[styles.detectedText, { color: colors.primary }]}>
                {detectedPlatform === "youtube" ? "YouTube" : detectedPlatform === "instagram" ? "Instagram" : "TikTok"} detected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a memorable title"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryRow}>
              {categories.map((cat) => {
                const selected = selectedCategory === cat.name;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat.name);
                    }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? cat.color + "22" : colors.secondary,
                        borderColor: selected ? cat.color + "66" : colors.border,
                      },
                    ]}
                  >
                    <Feather name={cat.icon as any} size={13} color={selected ? cat.color : colors.mutedForeground} />
                    <Text style={[styles.chipText, { color: selected ? cat.color : colors.mutedForeground }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes, timestamps, or thoughts..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>REMINDER</Text>
          <View style={styles.reminderGrid}>
            {REMINDER_OPTIONS.map((opt) => {
              const val = opt.getValue();
              const active = reminder !== undefined && Math.abs(reminder - val) < 3600000;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReminder(active ? undefined : val);
                    setShowCustomDate(false);
                  }}
                  style={[
                    styles.reminderChip,
                    {
                      backgroundColor: active ? colors.primary + "22" : colors.secondary,
                      borderColor: active ? colors.primary + "55" : colors.border,
                    },
                  ]}
                >
                  <Feather name="clock" size={13} color={active ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.reminderText, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowCustomDate(!showCustomDate);
              }}
              style={[
                styles.reminderChip,
                {
                  backgroundColor: showCustomDate ? colors.accent + "22" : colors.secondary,
                  borderColor: showCustomDate ? colors.accent + "55" : colors.border,
                },
              ]}
            >
              <Feather name="calendar" size={13} color={showCustomDate ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.reminderText, { color: showCustomDate ? colors.accent : colors.mutedForeground }]}>
                Custom
              </Text>
            </Pressable>
          </View>
          {reminder && (
            <View style={[styles.reminderSet, { backgroundColor: "#F59E0B" + "15" }]}>
              <Feather name="bell" size={13} color="#F59E0B" />
              <Text style={[styles.reminderSetText, { color: "#F59E0B" }]}>
                Reminder set for {formatReminder(reminder)}
              </Text>
              <Pressable onPress={() => setReminder(undefined)}>
                <Feather name="x" size={13} color="#F59E0B" />
              </Pressable>
            </View>
          )}
          {showCustomDate && Platform.OS !== "web" && (
            <DateTimePicker
              value={reminder ? new Date(reminder) : new Date(Date.now() + 86400000)}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                if (date) {
                  setReminder(date.getTime());
                  setShowCustomDate(false);
                }
              }}
              themeVariant="dark"
            />
          )}
        </View>

        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <LinearGradient
            colors={["#9B72F7", "#5B6BF8", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Feather name="bookmark" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Video</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 22 },
  section: { gap: 8 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderRadius: 13,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderRadius: 13,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderRadius: 13,
    borderWidth: 1,
    minHeight: 90,
  },
  detected: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  detectedText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  categoryScroll: { marginHorizontal: -16 },
  categoryRow: { flexDirection: "row", gap: 7, paddingHorizontal: 16 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  reminderGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  reminderText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  reminderSet: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 7,
  },
  reminderSetText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
