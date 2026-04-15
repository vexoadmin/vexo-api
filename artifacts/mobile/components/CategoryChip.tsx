import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface CategoryChipProps {
  label: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
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
          style={{ borderRadius: 20 }}
        >
          <LinearGradient
            colors={["#7C5CFF", "#4CC9F0"]}
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
    shadowColor: "#7C5CFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  selectedPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  selectedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.1,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#11131F",
    borderWidth: 1,
    borderColor: "#1A1B2E",
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A5170",
    letterSpacing: 0.1,
  },
});
