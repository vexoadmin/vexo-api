import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

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
  const chipColor = color || colors.primary;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  }
  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          selected
            ? { backgroundColor: chipColor, borderColor: chipColor }
            : { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? "#fff" : colors.mutedForeground },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});
