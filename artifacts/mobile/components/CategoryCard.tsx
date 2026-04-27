import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { Category } from "@/contexts/SavedItemsContext";

interface CategoryCardProps {
  category: Category;
  itemCount: number;
  onPress: () => void;
  onEdit?: () => void;
  index?: number;
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();

  if (n.includes("recipe") || n.includes("food") || n.includes("cook")) return "coffee";
  if (n.includes("kid") || n.includes("child")) return "smile";
  if (n.includes("travel") || n.includes("trip")) return "map";
  if (n.includes("learn") || n.includes("study")) return "book-open";
  if (n.includes("inspiration")) return "star";
  if (n.includes("tip")) return "zap";
  if (n.includes("music")) return "music";
  if (n.includes("fit") || n.includes("workout") || n.includes("health")) return "activity";
  if (n.includes("tech")) return "cpu";

  return "bookmark";
}

export function CategoryCard({
  category,
  itemCount,
  onPress,
  onEdit,
  index = 0,
}: CategoryCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = category.color || "#8B5CF6";
  const isEven = index % 2 === 0;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.955,
      useNativeDriver: true,
      speed: 45,
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
    onPress();
  }

  function handleEditPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit?.();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardOuter}
      >
        <LinearGradient
          colors={
            isEven
              ? ["rgba(217,70,239,0.14)", "rgba(139,92,246,0.08)", "rgba(34,211,238,0.08)"]
              : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: glow + "18",
              borderColor: glow + "2E",
              shadowColor: glow,
            },
          ]}
        >
          <Feather name={(category.icon || getCategoryIcon(category.name)) as any} size={22} color={glow} />
        </View>

        <View style={styles.topRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{itemCount} saved</Text>
          </View>
        </View>

        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.desc}>Quick access to everything saved here</Text>

        {onEdit && (
          <Pressable onPress={handleEditPress} style={styles.editBtn} hitSlop={6}>
            <Feather name="more-horizontal" size={16} color="rgba(255,255,255,0.58)" />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function AddCategoryCard({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.955,
      useNativeDriver: true,
      speed: 45,
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
    onPress();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.addCard}
      >
        <View style={styles.addTopRow}>
          <Text style={styles.addPlus}>＋</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        </View>

        <Text style={styles.addName}>Add Category</Text>
        <Text style={styles.addDesc}>Create a new custom category</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "50%",
    padding: 5,
  },

  cardOuter: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    overflow: "hidden",
    minHeight: 164,
  },

  iconShell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },

  topRow: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  countBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  countText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.60)",
  },

  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginTop: 2,
  },

  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.46)",
    lineHeight: 17,
    marginTop: 4,
    paddingRight: 8,
  },

  editBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  addCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
    padding: 16,
    overflow: "hidden",
    minHeight: 164,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },

  addTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  addPlus: {
    fontSize: 26,
    color: "#A5F3FC",
  },

  newBadge: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  newBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#A5F3FC",
  },

  addName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#A5F3FC",
    letterSpacing: -0.2,
  },

  addDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(165,243,252,0.70)",
    lineHeight: 17,
    marginTop: 4,
  },
});