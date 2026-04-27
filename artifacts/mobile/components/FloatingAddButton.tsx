import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type FloatingAddButtonProps = {
  onPress: () => void;
  bottomOffset?: number;
};

export function FloatingAddButton({
  onPress,
  bottomOffset = 86,
}: FloatingAddButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.58)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.92,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.58,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [glow]);

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <View style={[styles.anchor, { bottom: bottomOffset }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glow,
            transform: [
              {
                scale: glow.interpolate({
                  inputRange: [0.58, 0.92],
                  outputRange: [0.96, 1.08],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={10}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Text style={styles.plus}>+</Text>
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
    zIndex: 20,
  },

  glow: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: "#8B5CF6",
  },

  btn: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 14,
  },

  plus: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 34,
    fontFamily: "Inter_600SemiBold",
    marginTop: -3,
  },
});