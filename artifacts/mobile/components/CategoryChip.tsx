import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

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
    Animated.spring(scale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 45,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 34,
      bounciness: 6,
    }).start();
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  if (selected) {
    return (
      <Animated.View style={[styles.selectedWrap, { transform: [{ scale }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={styles.selectedPressable}
        >
          <View style={styles.selectedGlow} />

          <LinearGradient
            colors={[
              "rgba(217,70,239,0.34)",
              "rgba(139,92,246,0.34)",
              "rgba(34,211,238,0.34)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectedBorder}
          >
            <View style={styles.selectedInner}>
              <Text style={styles.selectedText}>{label}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.defaultWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={({ pressed }) => [
          styles.defaultPill,
          pressed && styles.defaultPillPressed,
        ]}
      >
        <Text style={styles.defaultText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  selectedWrap: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 5,
  },

  selectedPressable: {
    position: "relative",
    borderRadius: 18,
    overflow: "visible",
  },

  selectedGlow: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 6,
    bottom: 6,
    borderRadius: 18,
    backgroundColor: "rgba(168,85,247,0.18)",
  },

  selectedBorder: {
    borderRadius: 18,
    padding: 1,
  },

  selectedInner: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: "rgba(12,15,28,0.86)",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },

  defaultWrap: {
    borderRadius: 18,
  },

  defaultPill: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  defaultPillPressed: {
    opacity: 0.84,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  defaultText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.84)",
    letterSpacing: 0.08,
  },
});