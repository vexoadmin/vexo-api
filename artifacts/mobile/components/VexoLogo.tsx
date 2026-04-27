import React from "react";
import { Image, StyleSheet, View } from "react-native";

export function VexoLogo() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.blueGlowOuter} pointerEvents="none" />
      <View style={styles.blueGlowInner} pointerEvents="none" />

      <Image
        source={require("../assets/images/vexo-logo-muted-cropped.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 220,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  blueGlowOuter: {
    position: "absolute",
    left: 8,
    top: 14,
    width: 98,
    height: 98,
    borderRadius: 999,
    backgroundColor: "rgba(98,110,220,0.12)",
  },

  blueGlowInner: {
    position: "absolute",
    right: 12,
    top: 20,
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.09)",
  },

  logo: {
    width: 220,
    height: 86,
  },
});