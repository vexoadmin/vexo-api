import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface VexoLogoProps {
  width?: number;
  height?: number;
}

export function VexoLogo({ width = 120, height = 42 }: VexoLogoProps) {
  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Image
        source={require("../assets/vexo-logo.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#060914",
    shadowColor: "#784BEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
