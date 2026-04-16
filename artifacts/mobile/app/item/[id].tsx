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

import { useSavedItems, Category } from "@/contexts/SavedItemsContext";

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
  website: "Website",
  pinterest: "Pinterest",
};
const PLATFORM_ICONS: Record<string, string> = {
  youtube: "play-circle",
  tiktok: "video",
  instagram: "camera",
  facebook: "users",
  website: "globe",
  pinterest: "bookmark",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#EF4444",
  tiktok: "#22D3EE",
  instagram: "#D946EF",
  facebook: "#8B5CF6",
  website: "#6366F1",
  pinterest: "#E60023",
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
  const { items, categories, updateItem, deleteItem } = useSavedItems();

  const item = items.find((i) => i.id === id);
  const [thumbError, setThumbError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  /* ── Edit mode ── */
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(item?.title || "");
  const [editCategory, setEditCategory] = useState(item?.category || "");
  const [editNotes, setEditNotes] = useState(item?.notes || "");
  const [editReminder, setEditReminder] = useState<number | undefined>(item?.reminder);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  /* ── Notes inline (view-mode only) ── */
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

  function handleEnterEdit() {
    setEditTitle(item!.title);
    setEditCategory(item!.category);
    setEditNotes(item!.notes || "");
    setEditReminder(item!.reminder);
    setShowEditDatePicker(false);
    setEditingNotes(false);
    setEditingReminder(false);
    setShowMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditMode(true);
  }

  function handleSaveEdit() {
    if (!editTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item!.id, {
      title: editTitle.trim(),
      category: editCategory,
      notes: editNotes.trim(),
      reminder: editReminder,
    });
    setNotes(editNotes.trim());
    setEditMode(false);
  }

  function handleCancelEdit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditMode(false);
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
            {item.thumbnailUrl && !thumbError ? (
              <>
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  onError={() => setThumbError(true)}
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
              {editMode ? (
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={styles.titleInput}
                  placeholderTextColor="rgba(255,255,255,0.30)"
                  placeholder="Title"
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <Text style={styles.itemTitle}>{item.title}</Text>
              )}
              <Text style={styles.savedDate}>Saved on {formatDate(item.createdAt)}</Text>
            </View>
            {!editMode && (
              <Pressable
                onPress={() => setShowMenu(!showMenu)}
                style={styles.menuBtn}
                hitSlop={8}
              >
                <Text style={styles.menuDots}>⋯</Text>
              </Pressable>
            )}
          </View>
          {showMenu && !editMode && (
            <Pressable onPress={handleDelete} style={styles.deleteRow}>
              <Feather name="trash-2" size={13} color="#EF4444" />
              <Text style={styles.deleteText}>Delete item</Text>
            </Pressable>
          )}
        </View>

        {/* ── 2. Edit mode: Category picker ── */}
        {editMode && (
          <View style={styles.card}>
            <Text style={styles.cardLabelUppercase}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {categories.map((cat: Category) => {
                const selected = editCategory === cat.name;
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditCategory(cat.name);
                    }}
                    style={[
                      styles.catChip,
                      selected && {
                        backgroundColor: cat.color + "22",
                        borderColor: cat.color + "70",
                      },
                    ]}
                  >
                    <Text style={styles.catChipIcon}>{cat.icon}</Text>
                    <Text style={[styles.catChipText, selected && { color: cat.color }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 3. Notes ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Personal note</Text>
            {!editMode && (
              <Pressable
                onPress={() => { if (editingNotes) handleSaveNotes(); else setEditingNotes(true); }}
                style={[styles.smallBtn, editingNotes && styles.smallBtnActive]}
              >
                <Text style={[styles.smallBtnText, editingNotes && { color: "#fff" }]}>
                  {editingNotes ? "Save" : "Edit"}
                </Text>
              </Pressable>
            )}
          </View>
          {editMode ? (
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Write your thoughts..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.notesInput}
              multiline
              textAlignVertical="top"
            />
          ) : editingNotes ? (
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

        {/* ── 4. Reminder ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Reminder</Text>
            {editMode ? (
              /* Edit mode: reminder state is editReminder */
              editReminder && editReminder > Date.now() ? (
                <>
                  <View style={styles.reminderActiveBadge}>
                    <Text style={styles.reminderActiveBadgeText}>Active</Text>
                  </View>
                  <Pressable
                    onPress={() => setEditReminder(undefined)}
                    style={[styles.smallBtn, { borderColor: "rgba(239,68,68,0.30)" }]}
                  >
                    <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>Remove</Text>
                  </Pressable>
                </>
              ) : null
            ) : (
              /* View mode */
              <>
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
              </>
            )}
          </View>

          {/* Edit mode reminder body */}
          {editMode && (
            <View style={{ gap: 8 }}>
              {editReminder && editReminder > Date.now() && (
                <Text style={styles.reminderText}>🔔 {formatReminder(editReminder)}</Text>
              )}
              <View style={styles.quickChips}>
                {REMINDER_QUICK.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setEditReminder(opt.getValue());
                    }}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickChipText}>{opt.label}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setShowEditDatePicker(!showEditDatePicker)}
                  style={[styles.quickChip, showEditDatePicker && styles.quickChipActive]}
                >
                  <Feather name="calendar" size={12} color={showEditDatePicker ? "#A5F3FC" : "rgba(255,255,255,0.45)"} />
                  <Text style={[styles.quickChipText, showEditDatePicker && { color: "#A5F3FC" }]}>
                    Custom date
                  </Text>
                </Pressable>
                {(editReminder && editReminder > Date.now()) ? null : (
                  <Pressable
                    onPress={() => setEditReminder(undefined)}
                    style={styles.quickChip}
                  >
                    <Text style={[styles.quickChipText, { color: "rgba(255,255,255,0.35)" }]}>None</Text>
                  </Pressable>
                )}
              </View>
              {showEditDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={editReminder ? new Date(editReminder) : new Date(Date.now() + 86400000)}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    if (date) {
                      setEditReminder(date.getTime());
                      setShowEditDatePicker(false);
                    }
                  }}
                  themeVariant="dark"
                />
              )}
            </View>
          )}

          {/* View mode reminder body */}
          {!editMode && hasReminder && !editingReminder && (
            <Text style={styles.reminderText}>🔔 {formatReminder(item.reminder!)}</Text>
          )}
          {!editMode && !hasReminder && !editingReminder && (
            <Pressable onPress={() => setEditingReminder(true)} style={styles.addReminderBtn}>
              <Feather name="plus" size={14} color="#A5F3FC" />
              <Text style={styles.addReminderText}>Add reminder</Text>
            </Pressable>
          )}
          {!editMode && editingReminder && (
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

        {/* ── 5. Action buttons ── */}
        {editMode ? (
          <View style={styles.actionsRow}>
            <Pressable onPress={handleCancelEdit} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveEdit}
              style={[styles.openBtn, { flex: 1, opacity: editTitle.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient
                colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.openBtnGrad}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.openBtnText}>Save changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable onPress={handleEnterEdit} style={styles.editBtn}>
              <Feather name="edit-2" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.editBtnText}>Edit</Text>
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
        )}

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  titleInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.4,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139,92,246,0.55)",
    paddingBottom: 4,
    paddingTop: 0,
  },
  cardLabelUppercase: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.40)",
    letterSpacing: 1.0,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  catChipIcon: {
    fontSize: 13,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.70)",
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
