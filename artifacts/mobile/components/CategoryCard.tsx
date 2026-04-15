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
        style={{ borderRadius: 18, overflow: "hidden" }}
      >
        <LinearGradient
          colors={[hexToRgba(category.color, 0.14), hexToRgba(category.color, 0.04)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { backgroundColor: colors.card, borderColor: hexToRgba(category.color, 0.18) },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: hexToRgba(category.color, 0.14), borderColor: hexToRgba(category.color, 0.22) }]}>
            <Feather name={category.icon as any} size={22} color={category.color} />
          </View>

          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]}>{category.name}</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {itemCount} {itemCount === 1 ? "video" : "videos"}
            </Text>
          </View>

          <View style={[styles.arrow, { backgroundColor: hexToRgba(category.color, 0.12), borderColor: hexToRgba(category.color, 0.2) }]}>
            <Feather name="chevron-right" size={16} color={category.color} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
