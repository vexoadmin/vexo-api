import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface VexoLogoProps {
  size?: number;
}

export function VexoLogo({ size = 44 }: VexoLogoProps) {
  const radius = Math.round(size * 0.27);

  return (
    <LinearGradient
      colors={["#1A0E38", "#0D1025"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Image
        source={require("../assets/vexo-logo.png")}
        style={{ width: size * 0.78, height: size * 0.78 }}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2C1A55",
    shadowColor: "#784BEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
