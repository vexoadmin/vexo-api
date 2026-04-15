import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
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

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};
const PLATFORM_ICONS: Record<string, string> = {
  youtube: "youtube",
  tiktok: "music",
  instagram: "instagram",
};
const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF5252",
  tiktok: "#A0AAFF",
  instagram: "#E879A0",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatReminder(ts: number) {
  const now = Date.now();
  const diff = ts - now;
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

const REMINDER_QUICK = [
  { label: "Tomorrow",  getValue: () => Date.now() + 86400000 },
  { label: "Next week", getValue: () => Date.now() + 7 * 86400000 },
];

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, deleteItem } = useSavedItems();

  const item = items.find((i) => i.id === id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item?.notes || "");
  const [editingReminder, setEditingReminder] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#FFFFFF" }}>Item not found</Text>
      </View>
    );
  }

  const platformColor = PLATFORM_COLORS[item.platform] ?? "#7C5CFF";
  const hasReminder = !!(item.reminder && item.reminder > Date.now());

  function handleOpenLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item!.url);
  }

  function handleSaveNotes() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item!.id, { notes });
    setEditingNotes(false);
  }

  function handleSetReminder(ts: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item!.id, { reminder: ts });
    setEditingReminder(false);
    setShowDatePicker(false);
  }

  function handleClearReminder() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateItem(item!.id, { reminder: undefined });
    setEditingReminder(false);
    setShowDatePicker(false);
  }

  function handleDelete() {
    Alert.alert("Delete Video", "Remove this saved video?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteItem(item!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero ── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[item.thumbnailColor + "CC", item.thumbnailColor + "55", "#0B0B12"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Watermark platform icon */}
          <Feather
            name={PLATFORM_ICONS[item.platform] as any}
            size={100}
            color="rgba(255,255,255,0.04)"
            style={styles.heroWatermark}
          />
          <View style={styles.heroContent}>
            {/* Labels row */}
            <View style={styles.heroLabels}>
              <View style={[styles.heroBadge, { backgroundColor: platformColor + "22", borderColor: platformColor + "40" }]}>
                <Feather name={PLATFORM_ICONS[item.platform] as any} size={11} color={platformColor} />
                <Text style={[styles.heroBadgeText, { color: platformColor }]}>
                  {PLATFORM_LABELS[item.platform]}
                </Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: item.thumbnailColor + "22", borderColor: item.thumbnailColor + "40" }]}>
                <View style={[styles.heroDot, { backgroundColor: item.thumbnailColor }]} />
                <Text style={[styles.heroBadgeText, { color: item.thumbnailColor }]}>
                  {item.category}
                </Text>
              </View>
            </View>

            {/* Play button */}
            <Pressable onPress={handleOpenLink} style={styles.playWrap}>
              <View style={styles.playRing}>
                <View style={styles.playInner}>
                  <Feather name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── 2. Title + date ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.savedDate}>Saved {formatDate(item.createdAt)}</Text>
        </View>

        {/* ── 3. Notes ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#7C5CFF18" }]}>
              <Feather name="edit-3" size={14} color="#9B7EFA" />
            </View>
            <Text style={styles.cardTitle}>Notes</Text>
            <Pressable
              onPress={() => {
                if (editingNotes) handleSaveNotes();
                else setEditingNotes(true);
              }}
              style={[styles.actionBtn, editingNotes && styles.actionBtnActive]}
            >
              <Text style={[styles.actionBtnText, editingNotes && { color: "#fff" }]}>
                {editingNotes ? "Save" : "Edit"}
              </Text>
            </Pressable>
          </View>
          {editingNotes ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your thoughts..."
              placeholderTextColor="#4A5170"
              style={styles.notesInput}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={[styles.notesText, !item.notes && { color: "#2A2E45" }]}>
              {item.notes || "No notes yet — tap Edit to add some"}
            </Text>
          )}
        </View>

        {/* ── 4. Reminder ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#F59E0B18" }]}>
              <Feather name="bell" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Reminder</Text>
            {hasReminder && !editingReminder && (
              <View style={styles.headerBtns}>
                <Pressable
                  onPress={() => setEditingReminder(true)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={handleClearReminder}
                  style={[styles.actionBtn, { borderColor: "#EF444430" }]}
                >
                  <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remove</Text>
                </Pressable>
              </View>
            )}
            {editingReminder && (
              <Pressable
                onPress={() => { setEditingReminder(false); setShowDatePicker(false); }}
                hitSlop={8}
              >
                <Feather name="x" size={16} color="#4A5170" />
              </Pressable>
            )}
          </View>

          {/* Current reminder display */}
          {hasReminder && !editingReminder && (
            <View style={styles.reminderDisplay}>
              <Feather name="clock" size={13} color="#F59E0B" />
              <Text style={styles.reminderDateText}>
                {formatReminder(item.reminder!)}
              </Text>
            </View>
          )}

          {/* No reminder state */}
          {!hasReminder && !editingReminder && (
            <Pressable
              onPress={() => setEditingReminder(true)}
              style={styles.addReminderBtn}
            >
              <Feather name="plus" size={14} color="#7C5CFF" />
              <Text style={styles.addReminderText}>Add reminder</Text>
            </Pressable>
          )}

          {/* Editing / creating reminder */}
          {editingReminder && (
            <View style={styles.reminderEditArea}>
              <View style={styles.quickChips}>
                {REMINDER_QUICK.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => handleSetReminder(opt.getValue())}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickChipText}>{opt.label}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  style={[styles.quickChip, showDatePicker && styles.quickChipActive]}
                >
                  <Feather name="calendar" size={12} color={showDatePicker ? "#7C5CFF" : "#9CA3AF"} />
                  <Text style={[styles.quickChipText, showDatePicker && { color: "#7C5CFF" }]}>
                    Custom date
                  </Text>
                </Pressable>
              </View>
              {showDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={item.reminder ? new Date(item.reminder) : new Date(Date.now() + 86400000)}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    if (date) handleSetReminder(date.getTime());
                  }}
                  themeVariant="dark"
                />
              )}
            </View>
          )}
        </View>

        {/* ── 5. Action buttons ── */}
        <View style={styles.actionsRow}>
          <Pressable onPress={handleOpenLink} style={[styles.actionCard, { flex: 1 }]}>
            <LinearGradient
              colors={["#7C5CFF", "#4CC9F0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionCardGrad}
            >
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={styles.actionCardText}>Open Source</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={styles.deleteCard}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </Pressable>
        </View>

        {/* ── 6. AI section ── */}
        <View style={[styles.card, styles.aiCard]}>
          <LinearGradient
            colors={["#6466EF12", "#A56BF708", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={["#6466EF", "#A56BF7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconWrap}
            >
              <Feather name="zap" size={14} color="#fff" />
            </LinearGradient>
            <Text style={styles.cardTitle}>AI Insights</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          </View>
          <View style={styles.aiContent}>
            <View style={styles.aiRow}>
              <Feather name="file-text" size={13} color="#6466EF60" />
              <Text style={styles.aiFeatureText}>Auto-generated summary</Text>
            </View>
            <View style={styles.aiRow}>
              <Feather name="list" size={13} color="#6466EF60" />
              <Text style={styles.aiFeatureText}>Key takeaways</Text>
            </View>
            <View style={styles.aiRow}>
              <Feather name="link" size={13} color="#6466EF60" />
              <Text style={styles.aiFeatureText}>Related content suggestions</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { gap: 14 },

  hero: {
    height: 220,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroWatermark: {
    position: "absolute",
    right: -16,
    top: "10%",
  },
  heroContent: {
    padding: 16,
    gap: 16,
  },
  heroLabels: {
    flexDirection: "row",
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  playWrap: {
    alignSelf: "center",
    marginBottom: 4,
  },
  playRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  playInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  titleBlock: {
    paddingHorizontal: 16,
    gap: 6,
  },
  itemTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
    lineHeight: 30,
    color: "#FFFFFF",
  },
  savedDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A5170",
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    color: "#FFFFFF",
  },
  headerBtns: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#0E1020",
  },
  actionBtnActive: {
    backgroundColor: "#7C5CFF",
    borderColor: "#7C5CFF",
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#9CA3AF",
  },

  notesInput: {
    backgroundColor: "#0E1020",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    minHeight: 90,
    lineHeight: 21,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    color: "#FFFFFF",
  },

  reminderDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F59E0B10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B20",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reminderDateText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#F59E0B",
  },

  addReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C5CFF30",
    backgroundColor: "#7C5CFF0C",
    alignSelf: "flex-start",
  },
  addReminderText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#7C5CFF",
  },

  reminderEditArea: {
    gap: 10,
  },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: BORDER,
    gap: 5,
  },
  quickChipActive: {
    backgroundColor: "#7C5CFF14",
    borderColor: "#7C5CFF40",
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
  },

  actionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  actionCardGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  actionCardText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  deleteCard: {
    width: 54,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "#EF444430",
    alignItems: "center",
    justifyContent: "center",
  },

  aiCard: {
    marginBottom: 8,
  },
  aiContent: {
    gap: 8,
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiFeatureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3D5C",
  },
  comingSoonBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6466EF30",
    backgroundColor: "#6466EF18",
  },
  comingSoonText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    color: "#9B7EFA",
  },
});
