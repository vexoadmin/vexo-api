import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.03)";

const SUPPORT_EMAIL = "support@vexosave.com";
const FEEDBACK_EMAIL = "feedback@vexosave.com";

function openMail(to: string, subject: string) {
  Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(subject)}`);
}

interface ActionRowProps {
  icon: string;
  label: string;
  description: string;
  iconColor: string;
  onPress: () => void;
  isLast?: boolean;
}

function ActionRow({ icon, label, description, iconColor, onPress, isLast }: ActionRowProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 32, bounciness: 5 }).start();
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.actionRow, !isLast && styles.actionRowBorder]}
      >
        {/* Icon container */}
        <View style={[styles.iconWrap, { backgroundColor: iconColor + "18", borderColor: iconColor + "30" }]}>
          <Feather name={icon as any} size={18} color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionDesc}>{description}</Text>
        </View>

        {/* Chevron */}
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.25)" />
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 24 : insets.bottom + 90;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 24, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSub}>Help, feedback & info</Text>
        </View>

        {/* ── Help & Support card ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>HELP & SUPPORT</Text>
        </View>

        <View style={styles.card}>
          <ActionRow
            icon="mail"
            label="Contact Us"
            description="Reach our team directly"
            iconColor="#A5F3FC"
            onPress={() => openMail(SUPPORT_EMAIL, "Vexo Save — Contact")}
          />
          <ActionRow
            icon="help-circle"
            label="Support"
            description="Having trouble? We're here"
            iconColor="#8B5CF6"
            onPress={() => openMail(SUPPORT_EMAIL, "Vexo Save — Support Request")}
          />
          <ActionRow
            icon="message-square"
            label="Send Feedback"
            description="Tell us what you think"
            iconColor="#D946EF"
            onPress={() => openMail(FEEDBACK_EMAIL, "Vexo Save — Feedback")}
            isLast
          />
        </View>

        {/* ── About card ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>ABOUT</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.aboutRow}>
            {/* Mini gradient badge */}
            <LinearGradient
              colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aboutGradientBadge}
            >
              <Feather name="bookmark" size={14} color="#fff" />
            </LinearGradient>
            <View style={styles.aboutText}>
              <Text style={styles.aboutAppName}>Vexo Save</Text>
              <Text style={styles.aboutVersion}>Version 1.0 · MVP</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.aboutTagline}>
            Save. Organize. Find.{"\n"}
            Your personal video library — always in your pocket.
          </Text>
        </View>

        {/* ── Support email hint ── */}
        <Text style={styles.footerHint}>
          📬  {SUPPORT_EMAIL}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, gap: 10 },

  header: { marginBottom: 8 },
  headerTitle: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.40)",
    marginTop: 4,
  },

  sectionLabel: { paddingHorizontal: 4, marginTop: 6 },
  sectionLabelText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.30)",
  },

  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: CARD_BG,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 2 },
  actionLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.92)",
  },
  actionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.40)",
  },

  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
  },
  aboutGradientBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutText: { flex: 1 },
  aboutAppName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  aboutVersion: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.40)",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  aboutTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  footerHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(165,243,252,0.50)",
    textAlign: "center",
    marginTop: 8,
    paddingBottom: 8,
  },
});
