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

import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

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
  youtube: "#FF0000",
  tiktok: "#ffffff",
  instagram: "#E1306C",
};

function formatReminder(ts: number) {
  const now = Date.now();
  const diff = ts - now;
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ItemDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, deleteItem } = useSavedItems();

  const item = items.find((i) => i.id === id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item?.notes || "");

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Item not found</Text>
      </View>
    );
  }

  function handleOpenLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item!.url);
  }

  function handleSaveNotes() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item!.id, { notes });
    setEditingNotes(false);
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

  const createdDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const hasReminder = item.reminder && item.reminder > Date.now();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[item.thumbnailColor + "DD", item.thumbnailColor + "55", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <Pressable onPress={handleOpenLink} style={styles.bigPlay}>
            <View style={styles.bigPlayInner}>
              <Feather name="play" size={30} color="#fff" />
            </View>
          </Pressable>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={[styles.platformBadge, { backgroundColor: item.thumbnailColor + "20" }]}>
              <Feather name={PLATFORM_ICONS[item.platform] as any} size={12} color={PLATFORM_COLORS[item.platform]} />
              <Text style={[styles.platformText, { color: colors.mutedForeground }]}>
                {PLATFORM_LABELS[item.platform]}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{createdDate}</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>

          <View style={[styles.categoryBadge, { backgroundColor: item.thumbnailColor + "18" }]}>
            <View style={[styles.dot, { backgroundColor: item.thumbnailColor }]} />
            <Text style={[styles.categoryText, { color: item.thumbnailColor }]}>{item.category}</Text>
          </View>
        </View>

        {hasReminder && (
          <View style={[styles.card, { backgroundColor: "#F59E0B" + "12", borderColor: "#F59E0B" + "30" }]}>
            <View style={styles.cardHeader}>
              <Feather name="bell" size={15} color="#F59E0B" />
              <Text style={[styles.cardTitle, { color: "#F59E0B" }]}>Reminder</Text>
            </View>
            <Text style={[styles.reminderText, { color: colors.foreground }]}>
              {formatReminder(item.reminder!)}
            </Text>
            <Pressable onPress={() => updateItem(item.id, { reminder: undefined })} style={styles.clearReminder}>
              <Text style={[styles.clearText, { color: "#F59E0B" }]}>Clear reminder</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="edit-3" size={15} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes</Text>
            <Pressable
              onPress={() => {
                if (editingNotes) handleSaveNotes();
                else setEditingNotes(true);
              }}
              style={[styles.editBtn, { backgroundColor: editingNotes ? colors.primary : colors.secondary }]}
            >
              <Text style={[styles.editBtnText, { color: editingNotes ? "#fff" : colors.mutedForeground }]}>
                {editingNotes ? "Save" : "Edit"}
              </Text>
            </Pressable>
          </View>
          {editingNotes ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.notesInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={[styles.notesText, { color: item.notes ? colors.foreground : colors.mutedForeground }]}>
              {item.notes || "No notes yet — tap Edit to add some"}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="zap" size={15} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Insights</Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.accent + "18" }]}>
              <Text style={[styles.comingSoonText, { color: colors.accent }]}>Soon</Text>
            </View>
          </View>
          <Text style={[styles.notesText, { color: colors.mutedForeground }]}>
            Auto-generated summary, key takeaways, and related content suggestions are coming soon.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="link" size={15} color={colors.mutedForeground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Source</Text>
          </View>
          <Text style={[styles.urlText, { color: colors.accent }]} numberOfLines={2}>{item.url}</Text>
        </View>

        <Pressable onPress={handleOpenLink} style={styles.openBtn}>
          <LinearGradient
            colors={["#9B72F7", "#5B6BF8", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.openBtnGrad}
          >
            <Feather name="external-link" size={18} color="#fff" />
            <Text style={styles.openBtnText}>Open in App</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: colors.border }]}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Video</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12 },
  hero: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  bigPlay: { alignItems: "center" },
  bigPlayInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  body: { paddingHorizontal: 16, gap: 8 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  platformText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
  title: { fontSize: 21, fontFamily: "Inter_700Bold", lineHeight: 27, letterSpacing: -0.5 },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  card: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  notesInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  reminderText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  clearReminder: { alignSelf: "flex-start" },
  clearText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  comingSoonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  comingSoonText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  urlText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  openBtn: { marginHorizontal: 16, borderRadius: 14, overflow: "hidden" },
  openBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  openBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  deleteBtn: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  deleteBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
