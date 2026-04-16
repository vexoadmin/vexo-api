import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { SavedItem } from "@/contexts/SavedItemsContext";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  pinterest: "Pinterest",
};

const PLATFORM_ICONS: Record<string, string> = {
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

const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.04)";

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 24);
  }
}

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  isLarge?: boolean;
}

export function VideoCard({ item, onPress, isLarge }: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const thumbHeight = isLarge ? 200 : 136;
  const [thumbError, setThumbError] = useState(false);

  /* Reset error state whenever the thumbnail URL changes (e.g. after background repair) */
  React.useEffect(() => {
    setThumbError(false);
  }, [item.thumbnailUrl]);

  const platformColor = PLATFORM_COLORS[item.platform] ?? "#8B5CF6";
  const platformIcon = PLATFORM_ICONS[item.platform] ?? "link";
  const domain = extractDomain(item.url);

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
        {/* ── Thumbnail area ── */}
        <View style={[styles.thumb, { height: thumbHeight }]}>
          {item.thumbnailUrl && !thumbError ? (
            /* ── Real thumbnail ── */
            <>
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={() => setThumbError(true)}
              />
              {/* Bottom scrim so pills are readable */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.60)"]}
                start={{ x: 0, y: 0.4 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            /* ── Styled fallback — NEVER blank ── */
            <>
              {/* Base gradient */}
              <LinearGradient
                colors={["#D946EF22", "#8B5CF618", "#22D3EE22"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Top-left glow */}
              <LinearGradient
                colors={[platformColor + "28", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.7, y: 0.7 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Centered icon + domain */}
              <View style={styles.fallbackCenter}>
                <View style={[styles.fallbackIconWrap, { borderColor: platformColor + "55", backgroundColor: platformColor + "18" }]}>
                  <Feather name={platformIcon as any} size={22} color={platformColor} />
                </View>
                <Text style={[styles.fallbackDomain, { color: platformColor + "CC" }]} numberOfLines={1}>
                  {domain}
                </Text>
              </View>
              {/* Bottom-right platform badge */}
              <View style={styles.fallbackBadge}>
                <Text style={[styles.fallbackBadgeText, { color: platformColor }]}>
                  {PLATFORM_LABELS[item.platform]}
                </Text>
              </View>
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

        {/* ── Text area below thumbnail ── */}
        <View style={styles.textArea}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.source, { color: platformColor + "CC" }]}>
              {PLATFORM_LABELS[item.platform]}
            </Text>
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

  /* Fallback layout */
  fallbackCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackDomain: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    maxWidth: "75%",
    textAlign: "center",
  },
  fallbackBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  fallbackBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
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
