const palette = {
  background:          "#060814",
  foreground:          "#FFFFFF",
  card:                "#0B1020",
  cardForeground:      "#FFFFFF",
  primary:             "#8B5CF6",
  primaryForeground:   "#ffffff",
  secondary:           "#0B1020",
  secondaryForeground: "#E5E7EB",
  muted:               "#0B1020",
  mutedForeground:     "rgba(255,255,255,0.55)",
  accent:              "#22D3EE",
  accentForeground:    "#ffffff",
  destructive:         "#EF4444",
  destructiveForeground: "#ffffff",
  border:              "rgba(255,255,255,0.10)",
  input:               "#0B1020",
  tint:                "#8B5CF6",
  text:                "#ffffff",
  pink:                "#D946EF",
  blue:                "#22D3EE",
};

const colors = {
  light: palette,
  dark:  palette,
  radius: 24,
  gradient: {
    brand:     ["#D946EF", "#8B5CF6", "#22D3EE"] as const,
    brandFull: ["#D946EF", "#8B5CF6", "#22D3EE"] as const,
    purple:    ["#D946EF", "#8B5CF6"] as const,
    blue:      ["#8B5CF6", "#22D3EE"] as const,
    pink:      ["#D946EF", "#8B5CF6"] as const,
  },
};

export default colors;
