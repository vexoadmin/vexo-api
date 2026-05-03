import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
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

import { useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#040812";
const BORDER = "rgba(255,255,255,0.10)";
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  pinterest: "Pinterest",
};
const PLATFORM_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
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

const QUICK_REMINDERS = [
  { label: "Tomorrow", getValue: () => Date.now() + 86400000 },
  {
    label: "Weekend",
    getValue: () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      return Date.now() + daysUntilSat * 86400000;
    },
  },
  { label: "Next week", getValue: () => Date.now() + 7 * 86400000 },
];

function sameDay(a?: number, b?: number) {
  if (!a || !b) return false;

  const da = new Date(a);
  const db = new Date(b);

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatReminder(ts?: number) {
  if (!ts) return "No reminder";

  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractDomain(url: string): string {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Saved link";
  }
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, categories, updateItem, deleteItem } = useSavedItems();

  const itemId = Array.isArray(id) ? id[0] : id;

  const item = useMemo(() => {
    return items.find((savedItem) => savedItem.id === itemId);
  }, [items, itemId]);

  const [editing, setEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"view" | "edit" | null>(
    null
  );
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftReminder, setDraftReminder] = useState<number | undefined>();

  if (!item) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.notFoundText}>Item not found</Text>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const currentItem = item;
  const platformColor = PLATFORM_COLORS[currentItem.platform] ?? "#8B5CF6";
  const platformIcon = PLATFORM_ICONS[currentItem.platform] ?? "link";
  const platformLabel = PLATFORM_LABELS[currentItem.platform] ?? "Website";
  const domain = extractDomain(currentItem.url);

  function startEdit() {
    setDraftTitle(currentItem.title || "");
    setDraftCategory(currentItem.category || categories[0]?.name || "");
    setDraftNotes(currentItem.notes || "");
    setDraftReminder(currentItem.reminder);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setShowDatePicker(null);
  }

  function saveEdit() {
    updateItem(currentItem.id, {
      title: draftTitle.trim() || currentItem.title,
      category: draftCategory,
      notes: draftNotes.trim(),
      reminder: draftReminder,
    });

    setEditing(false);
    setShowDatePicker(null);
  }

  function setQuickReminder(ts: number) {
    updateItem(currentItem.id, { reminder: ts });
  }

  function clearReminder() {
    updateItem(currentItem.id, { reminder: undefined });
  }

  function openLink() {
    if (!currentItem.url) return;

    Linking.openURL(currentItem.url).catch(() => {
      Alert.alert("Could not open link", "Please try again later.");
    });
  }

  function removeItem() {
    Alert.alert("Delete item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteItem(currentItem.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#031020", "#051120", BG]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        enableOnAndroid={true}
        extraScrollHeight={120}
        extraHeight={120}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={28} color="#fff" />
          </Pressable>

          <Text style={styles.headerTitle}>Video Details</Text>

          <Pressable onPress={editing ? cancelEdit : startEdit} hitSlop={12}>
            <Feather name={editing ? "x" : "edit-2"} size={24} color="#fff" />
          </Pressable>
        </View>

        <Pressable onPress={openLink} style={styles.imageWrap}>
          {currentItem.thumbnailUrl ? (
            <Image
              source={{ uri: currentItem.thumbnailUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <>
              <LinearGradient
                colors={["#D946EF22", "#8B5CF618", "#22D3EE22"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.imageFallback}>
                <View
                  style={[
                    styles.fallbackIconWrap,
                    {
                      borderColor: `${platformColor}60`,
                      backgroundColor: `${platformColor}20`,
                    },
                  ]}
                >
                  <Feather name={platformIcon} size={26} color={platformColor} />
                </View>
                <Text style={styles.fallbackPlatform}>{platformLabel}</Text>
                <Text style={styles.fallbackDomain}>{domain}</Text>
              </View>
            </>
          )}

          <View style={styles.badgeLeft}>
            <Text style={styles.badgeText}>{currentItem.category}</Text>
          </View>

          <View style={styles.badgeRight}>
            <Text style={styles.platformText}>
              {currentItem.platform.toUpperCase()}
            </Text>
          </View>

          <View style={styles.playCircle}>
            <Feather
              name="play"
              size={22}
              color="#fff"
              style={{ marginLeft: 2 }}
            />
          </View>
        </Pressable>

        <Text style={styles.title} numberOfLines={4}>
          {currentItem.title || "Untitled"}
        </Text>

        {!editing ? (
          <>
            <View style={styles.quickCard}>
              <Pressable style={styles.editBtn} onPress={startEdit}>
                <Feather name="edit-2" size={15} color="#fff" />
                <Text style={styles.editBtnText}>Edit details</Text>
              </Pressable>

              <Text style={styles.remindLabel}>Remind me</Text>

              <View style={styles.reminderRow}>
                {QUICK_REMINDERS.map((r) => {
                  const value = r.getValue();
                  const active = sameDay(currentItem.reminder, value);

                  return (
                    <Pressable
                      key={r.label}
                      onPress={() => setQuickReminder(value)}
                      style={[
                        styles.reminderBtn,
                        active && styles.reminderBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.reminderText,
                          active && styles.reminderTextActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setShowDatePicker("view")}
                  style={styles.reminderBtnCustom}
                >
                  <Text style={styles.reminderText}>Pick date</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>PERSONAL NOTE</Text>
              <Text style={styles.text}>
                {currentItem.notes?.trim()
                  ? currentItem.notes
                  : "No notes yet. Tap Edit details to add one."}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>REMINDER</Text>

                {currentItem.reminder ? (
                  <Pressable onPress={clearReminder} style={styles.clearPill}>
                    <Text style={styles.clearPillText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text
                style={currentItem.reminder ? styles.reminderDate : styles.text}
              >
                {currentItem.reminder
                  ? `🔔 ${formatReminder(currentItem.reminder)}`
                  : "No reminder set"}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.editPanel}>
            <Text style={styles.editTitle}>Edit item</Text>

            <Text style={styles.label}>TITLE</Text>
            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
            />

            <Text style={styles.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {categories.map((cat) => {
                  const active = draftCategory === cat.name;

                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setDraftCategory(cat.name)}
                      style={[
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          active && styles.categoryTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.label}>NOTES</Text>
            <TextInput
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder="Add notes..."
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.textArea}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>REMIND ME</Text>
            <View style={styles.reminderRow}>
              {QUICK_REMINDERS.map((r) => {
                const value = r.getValue();
                const active = sameDay(draftReminder, value);

                return (
                  <Pressable
                    key={r.label}
                    onPress={() => setDraftReminder(value)}
                    style={[
                      styles.reminderBtn,
                      active && styles.reminderBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reminderText,
                        active && styles.reminderTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setShowDatePicker("edit")}
                style={styles.reminderBtnCustom}
              >
                <Text style={styles.reminderText}>Pick date</Text>
              </Pressable>
            </View>

            {draftReminder ? (
              <Pressable onPress={() => setDraftReminder(undefined)}>
                <Text style={styles.clearInline}>Clear reminder</Text>
              </Pressable>
            ) : null}

            <View style={[styles.editActions, { paddingBottom: insets.bottom + 24 }]}>
              <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveText}>Save changes</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>ORIGINAL LINK</Text>
          <Text style={styles.urlText} numberOfLines={2}>
            {currentItem.url}
          </Text>
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.actions,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 16,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: BG,
            borderTopWidth: 1,
            borderTopColor: BORDER,
          },
        ]}
      >
        <Pressable style={styles.deleteBtn} onPress={removeItem}>
          <Feather name="trash-2" size={17} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>

        <Pressable style={styles.openBtn} onPress={openLink}>
          <Feather name="external-link" size={17} color="#fff" />
          <Text style={styles.actionText}>Open original</Text>
        </Pressable>
      </View>

      {showDatePicker && Platform.OS !== "web" ? (
        <DateTimePicker
          value={
            showDatePicker === "edit" && draftReminder
              ? new Date(draftReminder)
              : currentItem.reminder
                ? new Date(currentItem.reminder)
                : new Date(Date.now() + 86400000)
          }
          mode="date"
          minimumDate={new Date()}
          themeVariant="dark"
          onChange={(_, date) => {
            const mode = showDatePicker;
            setShowDatePicker(null);

            if (!date) return;

            if (mode === "edit") {
              setDraftReminder(date.getTime());
            } else {
              updateItem(currentItem.id, { reminder: date.getTime() });
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  content: {
    paddingHorizontal: 20,
    gap: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },

  imageWrap: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: BORDER,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 8,
  },
  fallbackIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackPlatform: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  fallbackDomain: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  badgeLeft: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  badgeRight: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  platformText: {
    color: "#A78BFA",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  playCircle: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 26,
    fontFamily: "Inter_600SemiBold",
  },

  quickCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },

  editBtn: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.32)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  remindLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginLeft: 2,
  },

  reminderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  reminderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
  },

  reminderBtnCustom: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.10)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.34)",
  },

  reminderBtnActive: {
    backgroundColor: "rgba(217,70,239,0.16)",
    borderColor: "rgba(217,70,239,0.44)",
  },

  reminderText: {
    color: "#A5F3FC",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  reminderTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },

  label: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: "Inter_600SemiBold",
  },

  text: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },

  reminderDate: {
    color: "#A5F3FC",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  clearPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.10)",
  },

  clearPillText: {
    color: "#A5F3FC",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  editPanel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },

  editTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },

  input: {
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  textArea: {
    minHeight: 84,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: BORDER,
  },

  categoryChipActive: {
    backgroundColor: "rgba(217,70,239,0.12)",
    borderColor: "rgba(217,70,239,0.38)",
  },

  categoryText: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  categoryTextActive: {
    color: "#fff",
  },

  clearInline: {
    color: "#A5F3FC",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },

  cancelBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  saveText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  urlText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  deleteBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  openBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  notFoundText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});