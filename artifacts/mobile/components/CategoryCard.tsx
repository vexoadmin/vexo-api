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
}

export function CategoryCard({ category, itemCount, onPress }: CategoryCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const c = category.color;

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
    <Animated.View style={[styles.wrapper, { transform: [{ scale }], shadowColor: c }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { borderColor: c + "30" }]}
      >
        <LinearGradient
          colors={[c + "28", c + "10", "#0D1025"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <LinearGradient
            colors={[c + "20", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 1 }}
            style={styles.leftAccent}
          />

          <View style={[styles.iconBox, { backgroundColor: c + "20", borderColor: c + "35" }]}>
            <Feather name={category.icon as any} size={22} color={c} />
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{category.name}</Text>
            <Text style={styles.count}>
              {itemCount} {itemCount === 1 ? "video" : "videos"}
            </Text>
          </View>

          <View style={[styles.chevronBox, { backgroundColor: c + "18", borderColor: c + "28" }]}>
            <Feather name="chevron-right" size={15} color={c} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 9,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconBox: {
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
    color: "#F0F1FF",
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B7A9E",
  },
  chevronBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
