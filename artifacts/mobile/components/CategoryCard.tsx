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
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
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
        {/* Icon circle — only element with category colour */}
        <View style={[styles.iconCircle, { backgroundColor: c + "16" }]}>
          <Feather name={category.icon as any} size={20} color={c} style={{ opacity: 0.9 }} />
        </View>

        {/* Text */}
        <View style={styles.info}>
          <Text style={styles.name}>{category.name}</Text>
          <Text style={styles.count}>
            {itemCount} {itemCount === 1 ? "video" : "videos"}
          </Text>
        </View>

        {/* Arrow */}
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.18)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11131F",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1A1B2E",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
    color: "#FFFFFF",
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
  },
});
