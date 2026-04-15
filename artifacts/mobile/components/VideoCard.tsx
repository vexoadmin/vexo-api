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
  youtube: "#FF4040",
  tiktok: "#A0AAFF",
  instagram: "#E8749A",
};

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const height = isLarge ? 216 : 156;
  const accent = item.thumbnailColor;
  const platformColor = PLATFORM_COLORS[item.platform] ?? "#784BEA";

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 1,
    }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale }],
          shadowColor: accent,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* ── Thumbnail ── */}
        <View style={[styles.thumbnail, { height }]}>
          {/* Deep dark base */}
          <LinearGradient
            colors={["#0A0C1C", "#060810"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle colour wash from top-left corner */}
          <LinearGradient
            colors={[accent + "30", accent + "08", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom vignette to give depth */}
          <LinearGradient
            colors={["transparent", "rgba(4,5,14,0.82)"]}
            start={{ x: 0, y: 0.25 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top row – platform badge */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.platformBadge,
                { borderColor: platformColor + "35" },
              ]}
            >
              <Feather
                name={PLATFORM_ICONS[item.platform] as any}
                size={9}
                color={platformColor}
              />
            </View>

            {item.reminder && item.reminder > Date.now() && (
              <View style={styles.reminderPip}>
                <View style={styles.reminderPipCore} />
              </View>
            )}
          </View>

          {/* Centred play button – minimal frosted glass */}
          <View style={styles.playCenter}>
            <View style={styles.playRing}>
              <View style={styles.playInner}>
                <Feather
                  name="play"
                  size={11}
                  color="rgba(255,255,255,0.9)"
                  style={{ marginLeft: 2 }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Info ── */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}

          <View style={styles.footer}>
            {/* Category pill */}
            <View style={[styles.catPill, { backgroundColor: accent + "16" }]}>
              <View style={[styles.catDot, { backgroundColor: accent }]} />
              <Text style={[styles.catText, { color: accent + "DD" }]}>
                {item.category}
              </Text>
            </View>

            {/* Platform label */}
            <Text style={[styles.platformLabel, { color: platformColor + "80" }]}>
              {PLATFORM_LABELS[item.platform]}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#171B30",
    backgroundColor: "#080A18",
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
    borderWidth: 1,
    backgroundColor: "rgba(8,10,24,0.75)",
  },
  reminderPip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderPipCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  playCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  playInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 5,
    backgroundColor: "#080A18",
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.15,
    color: "#DDE0F8",
  },
  notes: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    color: "#3E4860",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  catDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  catText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  platformLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.1,
  },
});
