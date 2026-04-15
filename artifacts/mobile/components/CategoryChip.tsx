import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  const chipColor = color || colors.primary;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
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
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={[
          styles.chip,
          selected
            ? { backgroundColor: chipColor, borderColor: chipColor }
            : { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        {selected && (
          <View style={styles.checkDot} />
        )}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});
