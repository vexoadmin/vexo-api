import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Category } from "@/contexts/SavedItemsContext";

function hexToRgba(hex: string, opacity: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

interface CategoryCardProps {
  category: Category;
  itemCount: number;
  onPress: () => void;
}

export function CategoryCard({ category, itemCount, onPress }: CategoryCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
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
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <LinearGradient
          colors={[
            hexToRgba(category.color, 0.18),
            hexToRgba(category.color, 0.06),
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { backgroundColor: colors.card, borderColor: hexToRgba(category.color, 0.15) }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: hexToRgba(category.color, 0.15) }]}>
            <Feather name={category.icon as any} size={24} color={category.color} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]}>{category.name}</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {itemCount} {itemCount === 1 ? "video" : "videos"}
            </Text>
          </View>
          <View style={[styles.arrow, { backgroundColor: hexToRgba(category.color, 0.12) }]}>
            <Feather name="chevron-right" size={18} color={category.color} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
