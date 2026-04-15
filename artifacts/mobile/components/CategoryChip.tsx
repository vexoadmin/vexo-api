import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface CategoryChipProps {
  label: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, color, selected, onPress }: CategoryChipProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const chipColor = color || "#784BEA";

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 55, bounciness: 2 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 36, bounciness: 12 }).start();
  }
  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  if (selected) {
    return (
      <Animated.View style={[styles.glowWrap, { transform: [{ scale }], shadowColor: chipColor }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          style={{ borderRadius: 22 }}
        >
          <LinearGradient
            colors={["#6466EF", "#784BEA", "#A56BF7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectedPill}
          >
            <View style={styles.activeDot} />
            <Text style={styles.selectedText}>{label}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        style={[styles.pill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
      >
        <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  selectedText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.1,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
});
