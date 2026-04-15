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

export function CategoryChip({ label, color, selected, onPress }: CategoryChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 55,
      bounciness: 1,
    }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 38,
      bounciness: 10,
    }).start();
  }
  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  if (selected) {
    return (
      <Animated.View
        style={[
          styles.glowWrap,
          { transform: [{ scale }], shadowColor: "#784BEA" },
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          style={{ borderRadius: 20 }}
        >
          <LinearGradient
            colors={["#6466EF", "#784BEA", "#A56BF7"]}
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
        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
        style={styles.pill}
      >
        <Text style={styles.pillText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  selectedPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  selectedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.15,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#0C0E1E",
    borderWidth: 1,
    borderColor: "#1A1E35",
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#3D4666",
    letterSpacing: 0.1,
  },
});
