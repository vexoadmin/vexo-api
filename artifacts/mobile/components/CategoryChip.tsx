import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface CategoryChipProps {
  label: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 55, bounciness: 0 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  }
  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  if (selected) {
    return (
      <Animated.View style={[styles.glowWrap, { transform: [{ scale }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={styles.selectedOuter}
        >
          <LinearGradient
            colors={["#D946EF33", "#8B5CF633", "#22D3EE33"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectedPill}
          >
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
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={styles.pill}
      >
        <Text style={styles.pillText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    shadowColor: "#D946EF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  selectedOuter: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(217,70,239,0.40)",
  },
  selectedPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  selectedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#fff",
    letterSpacing: 0.1,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 0.1,
  },
});
