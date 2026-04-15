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
const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF4040",
  tiktok: "#C0C8FF",
  instagram: "#F06292",
};

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const height = isLarge ? 210 : 152;
  const glow = item.thumbnailColor;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.955, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 10 }).start();
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }], shadowColor: glow }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { borderColor: glow + "38" }]}
      >
        <LinearGradient
          colors={[glow + "FF", glow + "CC", glow + "66"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.thumbnail, { height }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.12)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topRow}>
            <View style={[styles.platformBadge, { backgroundColor: "rgba(0,0,0,0.5)", borderColor: PLATFORM_COLORS[item.platform] + "40" }]}>
              <Feather name={PLATFORM_ICONS[item.platform] as any} size={10} color={PLATFORM_COLORS[item.platform]} />
            </View>
            {item.reminder && item.reminder > Date.now() && (
              <View style={styles.reminderPip}>
                <View style={styles.reminderPipCore} />
              </View>
            )}
          </View>

          <View style={styles.playCenter}>
            <LinearGradient
              colors={["rgba(255,255,255,0.30)", "rgba(255,255,255,0.10)"]}
              style={styles.playOuter}
            >
              <View style={styles.playInner}>
                <Feather name="play" size={13} color="#fff" style={{ marginLeft: 2 }} />
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={[glow + "18", "#0D1025"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.info}
        >
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text>
          ) : null}
          <View style={styles.footer}>
            <View style={[styles.catPill, { backgroundColor: glow + "22", borderColor: glow + "50" }]}>
              <View style={[styles.catDot, { backgroundColor: glow }]} />
              <Text style={[styles.catText, { color: glow }]}>{item.category}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#0D1025",
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
  reminderPip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(245,158,11,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderPipCore: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  playCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  playOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  playInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
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
    color: "#F0F1FF",
  },
  notes: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    color: "#6B7A9E",
  },
  footer: {
    flexDirection: "row",
    marginTop: 7,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 5,
    borderWidth: 1,
  },
  catDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  catText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
