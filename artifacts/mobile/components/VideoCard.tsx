import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { SavedItem } from "@/contexts/SavedItemsContext";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.04)";

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const thumbHeight = isLarge ? 200 : 136;

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
        style={styles.card}
      >
        {/* Thumbnail */}
        <View style={[styles.thumb, { height: thumbHeight }]}>
          {item.thumbnailUrl ? (
            <>
              {/* Real thumbnail */}
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              {/* Bottom scrim so category pill is readable */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.60)"]}
                start={{ x: 0, y: 0.4 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <>
              {/* Gradient placeholder */}
              <LinearGradient
                colors={["#D946EF40", "#8B5CF626", "#22D3EE33"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Radial highlight top-left */}
              <LinearGradient
                colors={["rgba(255,255,255,0.20)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.65, y: 0.65 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          )}

          {/* Reminder dot */}
          {item.reminder && item.reminder > Date.now() && (
            <View style={styles.reminderDot} />
          )}

          {/* Category pill — bottom left */}
          <View style={styles.catPill}>
            <Text style={styles.catPillText}>{item.category}</Text>
          </View>
        </View>

        {/* Text area below thumbnail */}
        <View style={styles.textArea}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.source}>{PLATFORM_LABELS[item.platform]}</Text>
          </View>
          {item.notes ? (
            <Text style={styles.note} numberOfLines={1}>{item.notes}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    padding: 8,
  },
  thumb: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  reminderDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22D3EE",
    opacity: 0.9,
  },
  catPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  catPillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.90)",
  },
  textArea: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
    color: "rgba(255,255,255,0.95)",
  },
  source: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(165,243,252,0.85)",
    marginTop: 1,
    flexShrink: 0,
  },
  note: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.50)",
    lineHeight: 15,
  },
});
