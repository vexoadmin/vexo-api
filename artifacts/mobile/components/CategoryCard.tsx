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
  index?: number;
}

export function CategoryCard({ category, itemCount, onPress, index = 0 }: CategoryCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isEven = index % 2 === 0;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.955, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
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
        style={styles.cardOuter}
      >
        {isEven ? (
          <LinearGradient
            colors={["#D946EF1A", "#8B5CF61A", "#22D3EE1A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Top row: icon + count badge */}
        <View style={styles.topRow}>
          <Feather name={category.icon as any} size={26} color="#fff" style={{ opacity: 0.85 }} />
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{itemCount} saved</Text>
          </View>
        </View>

        {/* Name + description */}
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.desc}>Quick access to everything saved here</Text>
      </Pressable>
    </Animated.View>
  );
}

export function AddCategoryCard({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.955, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
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
        style={styles.addCard}
      >
        <View style={styles.topRow}>
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
    minHeight: 130,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 17,
    marginTop: 2,
  },

  addCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
    padding: 16,
    overflow: "hidden",
    minHeight: 130,
    gap: 4,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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
    marginTop: 2,
  },
});
