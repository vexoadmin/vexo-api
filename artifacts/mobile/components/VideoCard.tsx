import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { SavedItem } from "@/contexts/SavedItemsContext";

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "youtube",
  tiktok: "music",
  instagram: "instagram",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const colors = useColors();
  const height = isLarge ? 220 : 160;

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: 16,
          backgroundColor: colors.card,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[item.thumbnailColor, item.thumbnailColor + "88", colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.thumbnail, { height, borderRadius: 16 }]}
      >
        <View style={styles.platformBadge}>
          <Feather
            name={PLATFORM_ICONS[item.platform] as any}
            size={12}
            color="#fff"
          />
          <Text style={styles.platformText}>
            {PLATFORM_LABELS[item.platform]}
          </Text>
        </View>
        <View style={styles.playContainer}>
          <View style={styles.playButton}>
            <Feather name="play" size={20} color="#fff" />
          </View>
        </View>
      </LinearGradient>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: item.thumbnailColor + "22" }]}>
            <Text style={[styles.categoryText, { color: item.thumbnailColor }]}>
              {item.category}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    overflow: "hidden",
  },
  thumbnail: {
    justifyContent: "space-between",
    padding: 12,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  platformText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  playContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  categoryRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
