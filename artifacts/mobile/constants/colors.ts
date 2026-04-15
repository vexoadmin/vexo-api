const palette = {
  background:          "#0B0B12",
  foreground:          "#FFFFFF",
  card:                "#11131F",
  cardForeground:      "#FFFFFF",
  primary:             "#7C5CFF",
  primaryForeground:   "#ffffff",
  secondary:           "#11131F",
  secondaryForeground: "#E5E7EB",
  muted:               "#0E1020",
  mutedForeground:     "#9CA3AF",
  accent:              "#4CC9F0",
  accentForeground:    "#ffffff",
  destructive:         "#EF4444",
  destructiveForeground: "#ffffff",
  border:              "#1A1B2E",
  input:               "#11131F",
  tint:                "#7C5CFF",
  text:                "#ffffff",
  pink:                "#FA7DBA",
  blue:                "#4CC9F0",
};

const colors = {
  light: palette,
  dark:  palette,
  radius: 20,
  gradient: {
    brand:     ["#7C5CFF", "#4CC9F0"] as const,
    brandFull: ["#7C5CFF", "#5E7FFF", "#4CC9F0"] as const,
    purple:    ["#7C5CFF", "#9B7EFA"] as const,
    blue:      ["#4CC9F0", "#5E7FFF"] as const,
    pink:      ["#D15780", "#FA7DBA"] as const,
  },
};

export default colors;
