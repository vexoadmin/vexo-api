import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

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
const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF5252",
  tiktok: "#A0AAFF",
  instagram: "#E879A0",
};

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const cardHeight = isLarge ? 268 : 182;
  const accent = item.thumbnailColor;
  const platformColor = PLATFORM_COLORS[item.platform] ?? "#7C5CFF";

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 32, bounciness: 6 }).start();
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { height: cardHeight }]}
      >
        {/* Dark base */}
        <View style={[StyleSheet.absoluteFill, styles.cardBg]} />

        {/* Very subtle colour tint at top — 10% opacity max */}
        <LinearGradient
          colors={[accent + "1A", "transparent"]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.8, y: 0.55 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Large platform watermark */}
        <View style={styles.watermark} pointerEvents="none">
          <Feather
            name={PLATFORM_ICONS[item.platform] as any}
            size={64}
            color="rgba(255,255,255,0.035)"
          />
        </View>

        {/* Platform badge — top left */}
        <View style={styles.topRow}>
          <View style={[styles.platformBadge, { borderColor: platformColor + "28" }]}>
            <Feather
              name={PLATFORM_ICONS[item.platform] as any}
              size={9}
              color={platformColor}
            />
          </View>
          {item.reminder && item.reminder > Date.now() && (
            <View style={styles.reminderDot} />
          )}
        </View>

        {/* Play button — center */}
        <View style={styles.playWrap}>
          <View style={styles.playBtn}>
            <Feather name="play" size={11} color="rgba(255,255,255,0.75)" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Bottom gradient overlay with title + meta */}
        <LinearGradient
          colors={["transparent", "rgba(8,8,14,0.82)", "#08080E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.overlay}
        >
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.footer}>
            <View style={[styles.catTag, { backgroundColor: accent + "14" }]}>
              <View style={[styles.catDot, { backgroundColor: accent }]} />
              <Text style={[styles.catText, { color: accent + "CC" }]}>{item.category}</Text>
            </View>
            <Text style={[styles.platformLabel, { color: platformColor + "70" }]}>
              {PLATFORM_LABELS[item.platform]}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A1B2E",
    justifyContent: "space-between",
  },
  cardBg: {
    backgroundColor: "#0C0E1C",
    borderRadius: 18,
  },
  watermark: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: -32,
    opacity: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  platformBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(10,10,20,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    opacity: 0.85,
  },
  playWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 4,
  },
  notes: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(156,163,175,0.7)",
    marginBottom: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.2,
    color: "#ECEEFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  catTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  catDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  catText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
  platformLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
