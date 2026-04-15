import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
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

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

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

function detectPlatform(url: string): "youtube" | "tiktok" | "instagram" | null {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  return null;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

const REMINDER_OPTIONS = [
  { label: "Tomorrow",  getValue: () => Date.now() + 86400000 },
  {
    label: "Weekend", getValue: () => {
      const now = new Date(); const day = now.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      return Date.now() + daysUntilSat * 86400000;
    }
  },
  { label: "Next week", getValue: () => Date.now() + 7 * 86400000 },
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
      url: normalizeUrl(url),
      title: title.trim(),
      platform: detectedPlatform,
      category: selectedCategory,
      notes: notes.trim(),
      thumbnailColor: "#8B5CF6",
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
      <Stack.Screen
        options={{
          title: "Save Video",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={{ paddingHorizontal: 4 }}
            >
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Video Link ── */}
        <View style={styles.section}>
          <Text style={styles.label}>VIDEO LINK</Text>
          <View style={[styles.inputRow, detectedPlatform && { borderColor: platformColor! + "40" }]}>
            <Feather name="link-2" size={15} color={platformColor || "rgba(255,255,255,0.28)"} />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste YouTube, TikTok, or Instagram link"
              placeholderTextColor="rgba(255,255,255,0.28)"
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
                colors={["#D946EF22", "#8B5CF615", "#22D3EE20"]}
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
                <View style={[styles.previewPlayBtn, { borderColor: platformColor! + "50" }]}>
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
              <Feather name="video" size={28} color="rgba(255,255,255,0.14)" />
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
            placeholderTextColor="rgba(255,255,255,0.28)"
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
                      active && { backgroundColor: "#D946EF15", borderColor: "rgba(217,70,239,0.35)" },
                    ]}
                  >
                    <Feather name={cat.icon as any} size={12} color={active ? "#D946EF" : "rgba(255,255,255,0.35)"} />
                    <Text style={[styles.catChipText, active && { color: "#fff" }]}>
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
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.textArea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── 6. Reminder — 2×2 grid ── */}
        <View style={styles.section}>
          <View style={styles.reminderLabelRow}>
            <Text style={styles.label}>🔔  REMINDER</Text>
            <Text style={styles.optionalLabel}>Optional</Text>
          </View>
          <View style={styles.reminderGrid}>
            {REMINDER_OPTIONS.map((opt) => {
              const val = opt.getValue();
              const active = reminder !== undefined && Math.abs(reminder - val) < 3600000;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => { Haptics.selectionAsync(); setReminder(active ? undefined : val); setShowCustomDate(false); }}
                  style={[styles.reminderCell, active && styles.reminderCellActive]}
                >
                  <Text style={[styles.reminderCellText, active && { color: "#A5F3FC" }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setShowCustomDate(!showCustomDate); }}
              style={[styles.reminderCell, styles.reminderCellCustom, showCustomDate && styles.reminderCellActive]}
            >
              <Text style={[styles.reminderCellText, { color: "#A5F3FC" }]}>
                Pick date
              </Text>
            </Pressable>
          </View>

          {reminder && (
            <View style={styles.reminderSet}>
              <Feather name="bell" size={12} color="#A5F3FC" />
              <Text style={styles.reminderSetText}>
                Reminder: {formatReminder(reminder)}
              </Text>
              <Pressable onPress={() => setReminder(undefined)} hitSlop={8}>
                <Feather name="x" size={12} color="rgba(255,255,255,0.35)" />
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
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Feather name="bookmark" size={17} color="#fff" />
            <Text style={styles.saveBtnText}>Save to Vexo Save</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 22 },

  section: { gap: 10 },
  label: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, color: "rgba(255,255,255,0.35)",
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: SURFACE, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  inputText: {
    flex: 1, fontSize: 15, fontFamily: "Inter_400Regular",
    color: "#FFFFFF", paddingVertical: 0,
  },

  input: {
    backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    fontFamily: "Inter_400Regular", color: "#FFFFFF",
  },

  textArea: {
    backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 14,
    fontFamily: "Inter_400Regular", color: "#FFFFFF",
    minHeight: 90, textAlignVertical: "top",
  },

  previewCard: {
    backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: BORDER,
    minHeight: 150, overflow: "hidden", padding: 16, gap: 10,
  },
  previewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewPlatformBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, borderWidth: 1, gap: 5,
  },
  previewPlatformText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  previewConfirmed: { flexDirection: "row", alignItems: "center", gap: 4 },
  previewConfirmedText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#34D399" },
  previewPlayArea: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  previewPlayBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  previewDesc: {
    fontSize: 13, fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.80)", textAlign: "center",
  },
  previewUrl: {
    fontSize: 10, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.30)", textAlign: "center",
  },
  previewEmpty: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 24 },
  previewEmptyText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.20)" },
  previewEmptySub: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.15)", textAlign: "center",
  },

  chipScroll: { marginHorizontal: -20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20 },
  catChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)", gap: 6,
  },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.55)" },

  reminderLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionalLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#A5F3FC", opacity: 0.8 },

  reminderGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reminderCell: {
    width: "47%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  reminderCellActive: {
    borderColor: "rgba(217,70,239,0.35)",
    backgroundColor: "rgba(217,70,239,0.10)",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  reminderCellCustom: {
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
  },
  reminderCellText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.80)",
  },

  reminderSet: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(34,211,238,0.08)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(34,211,238,0.20)",
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  reminderSetText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#A5F3FC" },

  cancelBtn: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.60)",
  },

  saveWrap: {
    borderRadius: 18, overflow: "hidden", marginTop: 4,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, gap: 9,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
