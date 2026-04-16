import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return "https://" + url;
}

function openUrl(url: string) {
  const full = normalizeUrl(url);
  if (Platform.OS === "web") {
    window.open(full, "_blank");
  } else {
    Linking.openURL(full);
  }
}

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.03)";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};
const PLATFORM_ICONS: Record<string, string> = {
  youtube: "play-circle",
  tiktok: "video",
  instagram: "camera",
  facebook: "users",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#EF4444",
  tiktok: "#22D3EE",
  instagram: "#D946EF",
  facebook: "#8B5CF6",
};

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 24);
  }
}

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
  const [showMenu, setShowMenu] = useState(false);

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#FFFFFF" }}>Item not found</Text>
      </View>
    );
  }

  const hasReminder = !!(item.reminder && item.reminder > Date.now());

  function handleOpenLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openUrl(item!.url);
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
        {/* ── 1. Hero thumbnail card ── */}
        <View style={styles.heroCard}>
          {/* Thumbnail */}
          <View style={styles.thumb}>
            {item.thumbnailUrl ? (
              <>
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                {/* Scrim for overlay readability */}
                <LinearGradient
                  colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              /* ── Styled fallback — never blank ── */
              <>
                <LinearGradient
                  colors={["#22D3EE22", "#8B5CF618", "#D946EF22"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={[(PLATFORM_COLORS[item.platform] ?? "#8B5CF6") + "30", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.7, y: 0.7 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Centered icon + domain */}
                <View style={styles.heroFallbackCenter}>
                  <View style={[
                    styles.heroFallbackIconWrap,
                    {
                      borderColor: (PLATFORM_COLORS[item.platform] ?? "#8B5CF6") + "55",
                      backgroundColor: (PLATFORM_COLORS[item.platform] ?? "#8B5CF6") + "20",
                    },
                  ]}>
                    <Feather
                      name={(PLATFORM_ICONS[item.platform] ?? "link") as any}
                      size={30}
                      color={PLATFORM_COLORS[item.platform] ?? "#8B5CF6"}
                    />
                  </View>
                  <Text style={[styles.heroFallbackDomain, { color: (PLATFORM_COLORS[item.platform] ?? "#8B5CF6") + "CC" }]}>
                    {extractDomain(item.url)}
                  </Text>
                </View>
              </>
            )}
            {/* Category pill — top left */}
            <View style={styles.heroCatPill}>
              <Text style={styles.heroPillText}>{item.category}</Text>
            </View>
            {/* Platform pill — top right */}
            <View style={styles.heroSrcPill}>
              <Text style={styles.heroSrcText}>{PLATFORM_LABELS[item.platform]}</Text>
            </View>
            {/* Center play button */}
            <Pressable onPress={handleOpenLink} style={styles.playWrap}>
              <View style={styles.playRing}>
                <Feather name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
              </View>
            </Pressable>
          </View>

          {/* Title + date row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.savedDate}>Saved on {formatDate(item.createdAt)}</Text>
            </View>
            <Pressable
              onPress={() => setShowMenu(!showMenu)}
              style={styles.menuBtn}
              hitSlop={8}
            >
              <Text style={styles.menuDots}>⋯</Text>
            </Pressable>
          </View>
          {showMenu && (
            <Pressable onPress={handleDelete} style={styles.deleteRow}>
              <Feather name="trash-2" size={13} color="#EF4444" />
              <Text style={styles.deleteText}>Delete item</Text>
            </Pressable>
          )}
        </View>

        {/* ── 2. Notes ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Personal note</Text>
            <Pressable
              onPress={() => { if (editingNotes) handleSaveNotes(); else setEditingNotes(true); }}
              style={[styles.smallBtn, editingNotes && styles.smallBtnActive]}
            >
              <Text style={[styles.smallBtnText, editingNotes && { color: "#fff" }]}>
                {editingNotes ? "Save" : "Edit"}
              </Text>
            </Pressable>
          </View>
          {editingNotes ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your thoughts..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.notesInput}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={[styles.notesText, !item.notes && { color: "rgba(255,255,255,0.25)" }]}>
              {item.notes || "No notes yet — tap Edit to add some"}
            </Text>
          )}
        </View>

        {/* ── 3. Reminder ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Reminder</Text>
            {hasReminder && !editingReminder && (
              <View style={styles.reminderActiveBadge}>
                <Text style={styles.reminderActiveBadgeText}>Active</Text>
              </View>
            )}
            {hasReminder && !editingReminder && (
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pressable onPress={() => setEditingReminder(true)} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>Edit</Text>
                </Pressable>
                <Pressable onPress={handleClearReminder} style={[styles.smallBtn, { borderColor: "rgba(239,68,68,0.30)" }]}>
                  <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>Remove</Text>
                </Pressable>
              </View>
            )}
            {editingReminder && (
              <Pressable onPress={() => { setEditingReminder(false); setShowDatePicker(false); }} hitSlop={8}>
                <Feather name="x" size={16} color="rgba(255,255,255,0.35)" />
              </Pressable>
            )}
          </View>

          {hasReminder && !editingReminder && (
            <Text style={styles.reminderText}>🔔 {formatReminder(item.reminder!)}</Text>
          )}

          {!hasReminder && !editingReminder && (
            <Pressable onPress={() => setEditingReminder(true)} style={styles.addReminderBtn}>
              <Feather name="plus" size={14} color="#A5F3FC" />
              <Text style={styles.addReminderText}>Add reminder</Text>
            </Pressable>
          )}

          {editingReminder && (
            <View style={{ gap: 8 }}>
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
                  <Feather name="calendar" size={12} color={showDatePicker ? "#A5F3FC" : "rgba(255,255,255,0.45)"} />
                  <Text style={[styles.quickChipText, showDatePicker && { color: "#A5F3FC" }]}>
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

        {/* ── 4. Action buttons — Edit item + Open source ── */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => setEditingNotes(!editingNotes)}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Edit item</Text>
          </Pressable>
          <Pressable onPress={handleOpenLink} style={[styles.openBtn, { flex: 1 }]}>
            <LinearGradient
              colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.openBtnGrad}
            >
              <Text style={styles.openBtnText}>Open source ↗</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── 5. AI Future area ── */}
        <View style={styles.aiArea}>
          <Text style={styles.aiLabel}>FUTURE AI AREA</Text>
          <Text style={styles.aiText}>
            In the future, this area will show smart summaries, ingredients, steps, address, or key points — depending on the content type.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { gap: 12, paddingBottom: 20 },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 10,
    overflow: "hidden",
  },
  thumb: {
    height: 160,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  heroFallbackIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackDomain: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  heroCatPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.90)",
  },
  heroSrcPill: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroSrcText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#A5F3FC",
  },
  playWrap: {
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  playRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.4,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  savedDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  menuBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 2,
  },
  menuDots: {
    fontSize: 14,
    color: "rgba(255,255,255,0.80)",
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  deleteText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#EF4444",
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 10,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.1,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  smallBtnActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  smallBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.75)",
  },

  notesInput: {
    backgroundColor: "rgba(0,0,0,0.20)",
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
    color: "rgba(255,255,255,0.75)",
  },

  reminderActiveBadge: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  reminderActiveBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#A5F3FC",
    letterSpacing: 0.4,
  },
  reminderText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(165,243,252,0.85)",
    lineHeight: 21,
  },
  addReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "rgba(34,211,238,0.08)",
    alignSelf: "flex-start",
  },
  addReminderText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#A5F3FC",
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    gap: 5,
  },
  quickChipActive: {
    backgroundColor: "rgba(34,211,238,0.10)",
    borderColor: "rgba(34,211,238,0.30)",
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.65)",
  },

  actionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  openBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
  },
  openBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 6,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  aiArea: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.25)",
    backgroundColor: "rgba(34,211,238,0.05)",
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  aiLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.8,
    color: "rgba(165,243,252,0.70)",
  },
  aiText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    color: "rgba(165,243,252,0.75)",
  },
});
