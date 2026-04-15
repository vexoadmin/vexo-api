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
  youtube: "#FF4040",
  tiktok: "#E0E0FF",
  instagram: "#F06292",
};

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const height = isLarge ? 196 : 148;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
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
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <LinearGradient
          colors={[item.thumbnailColor + "F0", item.thumbnailColor + "A0", item.thumbnailColor + "50"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.thumbnail, { height }]}
        >
          <View style={styles.topRow}>
            <View style={[styles.platformBadge, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: "rgba(255,255,255,0.08)" }]}>
              <Feather
                name={PLATFORM_ICONS[item.platform] as any}
                size={10}
                color={PLATFORM_COLORS[item.platform]}
              />
            </View>
            {item.reminder && item.reminder > Date.now() && (
              <View style={styles.reminderDot}>
                <View style={styles.reminderDotInner} />
              </View>
            )}
          </View>
          <View style={styles.playWrap}>
            <View style={styles.playRing}>
              <View style={styles.playButton}>
                <Feather name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
              </View>
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
            <View style={[styles.categoryPill, { backgroundColor: item.thumbnailColor + "1C" }]}>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
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
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  reminderDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.15)",
  },
  reminderDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  playWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  playRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 4,
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
    marginTop: 6,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
