import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VexoLogoProps {
  size?: number;
}

export function VexoLogo({ size = 44 }: VexoLogoProps) {
  const r = Math.round(size * 0.26);
  const fontSize = Math.round(size * 0.44);

  return (
    <LinearGradient
      colors={["#1A0E38", "#0E1225", "#0D1025"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.outer, { width: size, height: size, borderRadius: r }]}
    >
      <LinearGradient
        colors={["#6466EF", "#784BEA", "#A56BF7", "#FA7DBA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.innerGrad, { width: size - 2, height: size - 2, borderRadius: r - 1 }]}
      >
        <View style={[styles.innerDark, { borderRadius: r - 2 }]}>
          <View style={styles.sparkDot} />
          <Text style={[styles.letter, { fontSize }]}>V</Text>
        </View>
      </LinearGradient>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
    shadowColor: "#784BEA",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  innerGrad: {
    padding: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDark: {
    flex: 1,
    width: "100%",
    backgroundColor: "#0D1025",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkDot: {
    position: "absolute",
    top: "20%",
    right: "26%",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#A56BF7",
    shadowColor: "#A56BF7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  letter: {
    fontFamily: "Inter_700Bold",
    color: "#C8B8FF",
    letterSpacing: -1,
    lineHeight: undefined,
  },
});
