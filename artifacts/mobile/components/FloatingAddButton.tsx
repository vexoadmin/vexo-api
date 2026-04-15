import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

interface FloatingAddButtonProps {
  onPress: () => void;
  bottomOffset?: number;
}

export function FloatingAddButton({ onPress, bottomOffset = 100 }: FloatingAddButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 14 }).start();
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <View style={[styles.anchor, { bottom: bottomOffset }]}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Feather name="plus" size={26} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#22D3EE",
    opacity: 0.18,
  },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  },
});
