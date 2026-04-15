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

export default function ItemDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, deleteItem } = useSavedItems();

  const item = items.find((i) => i.id === id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item?.notes || "");

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Item not found</Text>
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
    Alert.alert("Delete Video", "Are you sure you want to delete this saved video?", [
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[item.thumbnailColor, item.thumbnailColor + "66", colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.playContainer}>
            <Pressable onPress={handleOpenLink} style={styles.bigPlayButton}>
              <Feather name="play" size={32} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.infoSection}>
          <View style={styles.platformRow}>
            <View style={[styles.platformBadge, { backgroundColor: item.thumbnailColor + "22" }]}>
              <Feather name={PLATFORM_ICONS[item.platform] as any} size={14} color={item.thumbnailColor} />
              <Text style={[styles.platformText, { color: item.thumbnailColor }]}>
                {PLATFORM_LABELS[item.platform]}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{createdDate}</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>

          <View style={[styles.categoryBadge, { backgroundColor: item.thumbnailColor + "15" }]}>
            <Feather name="folder" size={14} color={item.thumbnailColor} />
            <Text style={[styles.categoryText, { color: item.thumbnailColor }]}>{item.category}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: 16 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes</Text>
            <Pressable
              onPress={() => {
                if (editingNotes) handleSaveNotes();
                else setEditingNotes(true);
              }}
              style={[styles.editBtn, { backgroundColor: colors.primary + "22" }]}
            >
              <Feather name={editingNotes ? "check" : "edit-2"} size={16} color={colors.primary} />
            </Pressable>
          </View>
          {editingNotes ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add your notes..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.notesInput, { color: colors.foreground, backgroundColor: colors.secondary, borderRadius: 12 }]}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={[styles.notesText, { color: item.notes ? colors.foreground : colors.mutedForeground }]}>
              {item.notes || "No notes added"}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: 16 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Link</Text>
          <Text style={[styles.urlText, { color: colors.accent }]} numberOfLines={2}>
            {item.url}
          </Text>
        </View>

        <Pressable onPress={handleOpenLink} style={styles.openBtn}>
          <LinearGradient
            colors={["#8B5CF6", "#6366F1", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.openBtnGradient}
          >
            <Feather name="external-link" size={20} color="#fff" />
            <Text style={styles.openBtnText}>Open in App</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: colors.destructive }]}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Video</Text>
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
    gap: 16,
  },
  heroGradient: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  playContainer: {
    alignItems: "center",
  },
  bigPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  infoSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  platformText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  card: {
    marginHorizontal: 16,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  urlText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  openBtn: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  openBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
