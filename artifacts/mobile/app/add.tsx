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

const BG = "#0B0B12";
const SURFACE = "#11131F";
const BORDER = "#1A1B2E";

const ACCENT_COLORS = [
  "#7C5CFF", "#4CC9F0", "#A78BFA", "#F472B6",
  "#34D399", "#FBBF24", "#60A5FA", "#F87171",
];

function detectPlatform(url: string): "youtube" | "tiktok" | "instagram" | null {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  return null;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF5252",
  tiktok: "#A0AAFF",
  instagram: "#E879A0",
};
const PLATFORM_ICONS: Record<string, string> = {
  youtube: "youtube",
  tiktok: "music",
  instagram: "instagram",
};
const PLATFORM_NAMES: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};
const PLATFORM_DESC: Record<string, string> = {
  youtube: "YouTube video detected",
  tiktok: "TikTok video detected",
  instagram: "Instagram reel detected",
};

const REMINDER_OPTIONS = [
  { label: "Tomorrow",  icon: "sun" as const,      getValue: () => Date.now() + 86400000 },
  {
    label: "Weekend", icon: "coffee" as const, getValue: () => {
      const now = new Date(); const day = now.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      return Date.now() + daysUntilSat * 86400000;
    }
  },
  { label: "Next week", icon: "calendar" as const,  getValue: () => Date.now() + 7 * 86400000 },
];

export default function AddScreen() {
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
  const platformColor = detectedPlatform ? PLATFORM_COLORS[detectedPlatform] : null;
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
      thumbnailColor: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
      reminder,
    });
    router.back();
  }

  function formatReminder(ts: number) {
    return new Date(ts).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Video Link ── */}
        <View style={styles.section}>
          <Text style={styles.label}>VIDEO LINK</Text>
          <View style={[styles.inputRow, detectedPlatform && styles.inputRowActive]}>
            <Feather
              name="link-2"
              size={15}
              color={platformColor || "#4A5170"}
            />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste YouTube, TikTok, or Instagram link"
              placeholderTextColor="#4A5170"
              style={styles.inputText}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* ── 2. Preview Card ── */}
        <View style={styles.previewCard}>
          {detectedPlatform ? (
            <>
              <LinearGradient
                colors={[platformColor! + "22", platformColor! + "08", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.previewTop}>
                <View style={[styles.previewPlatformBadge, { backgroundColor: platformColor! + "18", borderColor: platformColor! + "30" }]}>
                  <Feather name={PLATFORM_ICONS[detectedPlatform] as any} size={12} color={platformColor!} />
                  <Text style={[styles.previewPlatformText, { color: platformColor! }]}>
                    {PLATFORM_NAMES[detectedPlatform]}
                  </Text>
                </View>
                <View style={styles.previewConfirmed}>
                  <Feather name="check-circle" size={12} color="#34D399" />
                  <Text style={styles.previewConfirmedText}>Link confirmed</Text>
                </View>
              </View>
              <View style={styles.previewPlayArea}>
                <View style={[styles.previewPlayBtn, { borderColor: platformColor! + "40" }]}>
                  <Feather name="play" size={20} color={platformColor!} style={{ marginLeft: 2 }} />
                </View>
              </View>
              <Text style={styles.previewDesc}>{PLATFORM_DESC[detectedPlatform]}</Text>
              {url.length > 0 && (
                <Text style={styles.previewUrl} numberOfLines={1}>{url}</Text>
              )}
            </>
          ) : (
            <View style={styles.previewEmpty}>
              <Feather name="video" size={28} color="#2A2E45" />
              <Text style={styles.previewEmptyText}>Video preview</Text>
              <Text style={styles.previewEmptySub}>Paste a link above to see a preview</Text>
            </View>
          )}
        </View>

        {/* ── 3. Title ── */}
        <View style={styles.section}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a memorable title"
            placeholderTextColor="#4A5170"
            style={styles.input}
          />
        </View>

        {/* ── 4. Category ── */}
        <View style={styles.section}>
          <Text style={styles.label}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {categories.map((cat) => {
                const active = selectedCategory === cat.name;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat.name); }}
                    style={[
                      styles.catChip,
                      active && { backgroundColor: cat.color + "18", borderColor: cat.color + "50" },
                    ]}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={12}
                      color={active ? cat.color : "#4A5170"}
                    />
                    <Text style={[styles.catChipText, active && { color: cat.color }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── 5. Notes ── */}
        <View style={styles.section}>
          <Text style={styles.label}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes, timestamps, or thoughts..."
            placeholderTextColor="#4A5170"
            style={styles.textArea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── 6. Reminder ── */}
        <View style={styles.section}>
          <Text style={styles.label}>REMINDER</Text>
          <View style={styles.chipRow}>
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
                  style={[styles.reminderChip, active && styles.reminderChipActive]}
                >
                  <Feather name={opt.icon} size={12} color={active ? "#7C5CFF" : "#4A5170"} />
                  <Text style={[styles.reminderChipText, active && { color: "#7C5CFF" }]}>
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
              style={[styles.reminderChip, showCustomDate && styles.reminderChipActive]}
            >
              <Feather name="calendar" size={12} color={showCustomDate ? "#7C5CFF" : "#4A5170"} />
              <Text style={[styles.reminderChipText, showCustomDate && { color: "#7C5CFF" }]}>
                Custom
              </Text>
            </Pressable>
          </View>

          {reminder && (
            <View style={styles.reminderSet}>
              <Feather name="bell" size={12} color="#7C5CFF" />
              <Text style={styles.reminderSetText}>
                Reminder set: {formatReminder(reminder)}
              </Text>
              <Pressable onPress={() => setReminder(undefined)} hitSlop={8}>
                <Feather name="x" size={12} color="#4A5170" />
              </Pressable>
            </View>
          )}

          {showCustomDate && Platform.OS !== "web" && (
            <DateTimePicker
              value={reminder ? new Date(reminder) : new Date(Date.now() + 86400000)}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                if (date) { setReminder(date.getTime()); setShowCustomDate(false); }
              }}
              themeVariant="dark"
            />
          )}
        </View>

        {/* ── 7. Save button ── */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveWrap, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#7C5CFF", "#4CC9F0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Feather name="bookmark" size={17} color="#fff" />
            <Text style={styles.saveBtnText}>Save to Library</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 22,
  },

  section: { gap: 10 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    color: "#4A5170",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  inputRowActive: { borderColor: "#7C5CFF40" },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    paddingVertical: 0,
  },

  input: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },

  textArea: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    minHeight: 90,
    textAlignVertical: "top",
  },

  previewCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 150,
    overflow: "hidden",
    padding: 16,
    gap: 10,
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewPlatformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    gap: 5,
  },
  previewPlatformText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  previewConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewConfirmedText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#34D399",
  },
  previewPlayArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  previewPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  previewDesc: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    textAlign: "center",
  },
  previewUrl: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#4A5170",
    textAlign: "center",
  },
  previewEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  previewEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#2A2E45",
  },
  previewEmptySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#1E2135",
    textAlign: "center",
  },

  chipScroll: { marginHorizontal: -20 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 6,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#4A5170",
  },

  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 6,
  },
  reminderChipActive: {
    backgroundColor: "#7C5CFF14",
    borderColor: "#7C5CFF40",
  },
  reminderChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#4A5170",
  },
  reminderSet: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C5CFF12",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7C5CFF28",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  reminderSetText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7C5CFF",
  },

  saveWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 9,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
