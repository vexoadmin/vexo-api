import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { SavedItem } from "@/contexts/SavedItemsContext";

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

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const height = isLarge ? 190 : 140;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: colors.card }]}
      >
        <LinearGradient
          colors={[item.thumbnailColor + "EE", item.thumbnailColor + "99", item.thumbnailColor + "44"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.thumbnail, { height }]}
        >
          <View style={styles.topRow}>
            <View style={[styles.platformBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <Feather
                name={PLATFORM_ICONS[item.platform] as any}
                size={10}
                color={PLATFORM_COLORS[item.platform]}
              />
            </View>
            {item.reminder && item.reminder > Date.now() && (
              <View style={[styles.reminderDot, { backgroundColor: "#F59E0B" }]} />
            )}
          </View>
          <View style={styles.playWrap}>
            <View style={styles.playButton}>
              <Feather name="play" size={16} color="#fff" />
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
          <View style={styles.footer}>
            <View style={[styles.categoryPill, { backgroundColor: item.thumbnailColor + "20" }]}>
              <View style={[styles.dot, { backgroundColor: item.thumbnailColor }]} />
              <Text style={[styles.categoryText, { color: item.thumbnailColor }]}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  thumbnail: {
    justifyContent: "space-between",
    padding: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  info: {
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  notes: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  footer: {
    flexDirection: "row",
    marginTop: 5,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});
