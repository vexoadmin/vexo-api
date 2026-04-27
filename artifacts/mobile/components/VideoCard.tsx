import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 24);
  }
}

function buildFavicon(url: string): string | null {
  const domain = extractDomain(url);
  if (!domain || !domain.includes(".")) return null;
  return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(
    domain
  )}`;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }

      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function buildYouTubeCandidates(
  url: string,
  existingThumbnailUrl?: string | null
): string[] {
  const candidates: string[] = [];

  if (existingThumbnailUrl && existingThumbnailUrl.trim()) {
    candidates.push(existingThumbnailUrl.trim());
  }

  const videoId = extractYouTubeId(url);

  if (videoId) {
    candidates.push(
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    );
  }

  return Array.from(new Set(candidates));
}

function buildThumbnailCandidates(item: SavedItem): string[] {
  const existing = item.thumbnailUrl?.trim();

  if (item.platform === "youtube") {
    return buildYouTubeCandidates(item.url, existing);
  }

  const favicon = buildFavicon(item.url);
  return Array.from(new Set([existing, favicon].filter(Boolean) as string[]));
}

interface VideoCardProps {
  item: SavedItem;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  isLarge?: boolean;
}

export function VideoCard({
  item,
  onPress,
  onLongPress,
  isSelected = false,
  selectionMode = false,
  isLarge = false,
}: VideoCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const thumbHeight = isLarge ? 200 : 136;

  const thumbnailCandidates = useMemo(
    () => buildThumbnailCandidates(item),
    [item.thumbnailUrl, item.url, item.platform]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setThumbError(false);
  }, [item.thumbnailUrl, item.url, item.platform]);

  const activeThumbnailUrl = thumbnailCandidates[candidateIndex] ?? null;
  const platformColor = PLATFORM_COLORS[item.platform] ?? "#8B5CF6";
  const platformIcon = PLATFORM_ICONS[item.platform] ?? "link";
  const platformLabel = PLATFORM_LABELS[item.platform] ?? "Website";
  const domain = extractDomain(item.url);

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 32,
      bounciness: 6,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
    // אם במצב בחירה – רק select
    if (selectionMode) {
      onPress();
      return;
    }
  
    onPress();
  }

  function handleLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  }

  function handleImageError() {
    const hasAnother = candidateIndex < thumbnailCandidates.length - 1;

    if (hasAnother) {
      setCandidateIndex((prev) => prev + 1);
      setThumbError(false);
    } else {
      setThumbError(true);
    }
  }

  const showRealThumbnail = !!activeThumbnailUrl && !thumbError;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        onPressIn={!selectionMode ? handlePressIn : undefined}
        onPressOut={!selectionMode ? handlePressOut : undefined}
        style={[
          styles.card,
          isSelected ? styles.cardSelected : null,
        ]}
      >
        <View style={[styles.thumb, { height: thumbHeight }]}>
          {showRealThumbnail ? (
            <>
              <Image
                source={{ uri: activeThumbnailUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={handleImageError}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <>
              <LinearGradient
                colors={["#D946EF22", "#8B5CF618", "#22D3EE22"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.fallbackCenter}>
                <Feather
                  name={platformIcon as any}
                  size={26}
                  color={platformColor}
                />
                <Text style={styles.fallbackPlatform}>{platformLabel}</Text>
                <Text style={[styles.fallbackDomain, { color: platformColor }]}>
                  {domain}
                </Text>
              </View>
            </>
          )}

          <View style={styles.catPill}>
            <Text style={styles.catPillText}>{item.category}</Text>
          </View>

          {selectionMode ? (
            <View style={styles.selectionOverlay}>
              <View
                style={[
                  styles.selectionCircle,
                  isSelected ? styles.selectionCircleActive : null,
                ]}
              >
                {isSelected ? (
                  <Feather name="check" size={16} color="#FFFFFF" />
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.source, { color: platformColor }]}>
            {platformLabel}
          </Text>
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

  cardSelected: {
    borderColor: "rgba(139,92,246,0.85)",
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  thumb: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },

  fallbackCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },

  fallbackDomain: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },

  fallbackPlatform: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

  catPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  catPillText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
  },

  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    padding: 8,
  },

  selectionCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.70)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "#8B5CF6",
  },

  textArea: {
    paddingTop: 8,
  },

  title: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },

  source: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});