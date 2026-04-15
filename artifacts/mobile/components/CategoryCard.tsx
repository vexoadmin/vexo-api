import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { Category } from "@/contexts/SavedItemsContext";

interface CategoryCardProps {
  category: Category;
  itemCount: number;
  onPress: () => void;
}

export function CategoryCard({ category, itemCount, onPress }: CategoryCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const c = category.color;

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
        style={styles.card}
      >
        <View style={[styles.absoluteFill, { backgroundColor: c + "08" }]} />

        <View style={[styles.iconCircle, { backgroundColor: c + "18" }]}>
          <Feather name={category.icon as any} size={22} color={c} />
        </View>

        <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.count}>
          {itemCount} {itemCount === 1 ? "video" : "videos"}
        </Text>
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
        <View style={styles.addIconCircle}>
          <Feather name="plus" size={20} color="#7C5CFF" />
        </View>
        <Text style={styles.addName}>New</Text>
        <Text style={styles.addSub}>Collection</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "50%",
    padding: 5,
  },
  card: {
    backgroundColor: "#11131F",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1A1B2E",
    paddingHorizontal: 14,
    paddingVertical: 18,
    alignItems: "flex-start",
    gap: 8,
    minHeight: 120,
    overflow: "hidden",
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
    color: "#FFFFFF",
  },
  count: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
  },

  addCard: {
    backgroundColor: "transparent",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#7C5CFF30",
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 18,
    alignItems: "flex-start",
    gap: 8,
    minHeight: 120,
    shadowColor: "#7C5CFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#7C5CFF18",
    borderWidth: 1,
    borderColor: "#7C5CFF30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  addName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
    color: "#7C5CFF",
  },
  addSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7C5CFF80",
  },
});
