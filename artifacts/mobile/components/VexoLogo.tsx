import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";

interface VexoLogoProps {
  height?: number;
}

// Vexo logo using the transparency-stripped PNG.
// The ~2.75:1 aspect ratio (logo is wide, not square).
export function VexoLogo({ height = 36 }: VexoLogoProps) {
  const width = Math.round(height * 2.75);

  return (
    <View
      style={[
        styles.wrap,
        { width, height },
        // Native shadow — does NOT create a box artifact on mobile
        Platform.OS !== "web" && {
          shadowColor: "#9B7EFA",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
          elevation: 0,
        },
      ]}
    >
      <Image
        source={require("../assets/vexo-logo-transparent.png")}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
