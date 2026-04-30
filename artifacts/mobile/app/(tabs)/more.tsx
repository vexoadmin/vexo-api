import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useAuth } from "@/contexts/AuthContext";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.03)";

const SUPPORT_EMAIL = "support@vexoapps.com";
const FEEDBACK_EMAIL = "hello@vexoapps.com";

function openMail(to: string, subject: string) {
  Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(subject)}`);
}

interface ActionRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  iconColor: string;
  onPress: () => void;
  isLast?: boolean;
}

function ActionRow({
  icon,
  label,
  description,
  iconColor,
  onPress,
  isLast,
}: ActionRowProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 32,
      bounciness: 5,
    }).start();
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
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: iconColor + "18",
              borderColor: iconColor + "30",
            },
          ]}
        >
          <Feather name={icon} size={18} color={iconColor} />
        </View>

        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionDesc}>{description}</Text>
        </View>

        <Feather
          name="chevron-right"
          size={16}
          color="rgba(255,255,255,0.25)"
        />
      </Pressable>
    </Animated.View>
  );
}

function UpcomingBlock({
  title,
  sectionKey,
  items,
  onOpenItem,
  isExpanded,
  onViewAll,
  onCollapse,
  isLast = false,
}: {
  title: string;
  sectionKey: "tomorrow" | "week" | "month";
  items: Array<{
    id: string;
    title: string;
    category: string;
    platform: string;
    reminder?: number;
  }>;
  onOpenItem: (id: string) => void;
  isExpanded: boolean;
  onViewAll: () => void;
  onCollapse: () => void;
  isLast?: boolean;
}) {
  const visibleItems = isExpanded ? items : items.slice(0, 4);

  return (
    <View style={[styles.upcomingBlock, !isLast && styles.actionRowBorder]}>
      <View style={styles.upcomingHeader}>
        <View>
          <Text style={styles.upcomingTitle}>{title}</Text>
          {isExpanded ? (
            <Text style={styles.upcomingExpandedSubtitle}>
              Showing all reminders
            </Text>
          ) : null}
        </View>
        <Text style={styles.upcomingCount}>{items.length}</Text>
      </View>

      {items.length === 0 ? (
        <Text style={styles.upcomingEmpty}>Nothing here yet</Text>
      ) : (
        visibleItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onOpenItem(item.id)}
            style={({ pressed }) => [
              styles.upcomingItem,
              pressed && styles.upcomingItemPressed,
            ]}
          >
            <View style={styles.upcomingDot} />

            <View style={styles.upcomingItemText}>
              <Text style={styles.upcomingItemTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.upcomingItemMeta}>
                {item.category} · {item.platform}
              </Text>
            </View>

            <Feather
              name="chevron-right"
              size={14}
              color="rgba(255,255,255,0.25)"
            />
          </Pressable>
        ))
      )}

      {items.length > 4 && !isExpanded ? (
        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [
            styles.upcomingToggleButton,
            pressed && styles.upcomingItemPressed,
          ]}
        >
          <Text style={styles.upcomingToggleText}>View all ({items.length})</Text>
          <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.70)" />
        </Pressable>
      ) : null}

      {items.length > 4 && isExpanded ? (
        <Pressable
          onPress={onCollapse}
          style={({ pressed }) => [
            styles.upcomingToggleButton,
            pressed && styles.upcomingItemPressed,
          ]}
        >
          <Text style={styles.upcomingToggleText}>Show less</Text>
          <Feather name="chevron-up" size={14} color="rgba(255,255,255,0.70)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items } = useSavedItems();
  const { mode, profile, signOut } = useAuth();
  const [expandedUpcomingSection, setExpandedUpcomingSection] = useState<
    null | "tomorrow" | "week" | "month"
  >(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 24 : insets.bottom + 90;

  const now = Date.now();
  const todayStart = startOfDay(now);
  const tomorrowStart = todayStart + 86400000;
  const dayAfterTomorrowStart = tomorrowStart + 86400000;
  const weekEndExclusive = todayStart + 86400000 * 7;
  const monthEndExclusive = todayStart + 86400000 * 30;

  const futureReminderItems = items
    .filter(
      (item) =>
        typeof item.reminder === "number" && item.reminder >= tomorrowStart
    )
    .sort((a, b) => (a.reminder || 0) - (b.reminder || 0));

  const tomorrowItems = futureReminderItems.filter(
    (item) =>
      typeof item.reminder === "number" &&
      item.reminder >= tomorrowStart &&
      item.reminder < dayAfterTomorrowStart
  );

  const weekItems = futureReminderItems.filter(
    (item) =>
      typeof item.reminder === "number" &&
      item.reminder >= dayAfterTomorrowStart &&
      item.reminder < weekEndExclusive
  );

  const monthItems = futureReminderItems.filter(
    (item) =>
      typeof item.reminder === "number" &&
      item.reminder >= weekEndExclusive &&
      item.reminder < monthEndExclusive
  );

  function openItem(id: string) {
    router.push(`/item/${id}`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowTopRight} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 24, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSub}>Help, feedback, schedule & info</Text>
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>ACCOUNT</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.accountBox}>
            <View style={styles.accountAvatar}>
              <Feather
                name={mode === "authenticated" ? "user-check" : "user"}
                size={18}
                color="#A5F3FC"
              />
            </View>

            <View style={styles.accountText}>
              <Text style={styles.accountName}>
                {mode === "authenticated"
                  ? profile?.name || "Logged in user"
                  : "Not signed in"}
              </Text>
              <Text style={styles.accountEmail}>
                {mode === "authenticated"
                  ? profile?.email || "Google account"
                  : "Sign in to sync your data across devices"}
              </Text>
            </View>
          </View>

          {mode === "authenticated" ? (
            <ActionRow
              icon="user"
              label="Profile"
              description="Manage your account settings"
              iconColor="#8B5CF6"
              onPress={() => {
                router.push("/profile");
              }}
            />
          ) : null}

          {mode === "authenticated" ? (
            <ActionRow
              icon="log-out"
              label="Logout"
              description="Sign out of your account"
              iconColor="#F87171"
              onPress={() => {
                signOut();
              }}
              isLast
            />
          ) : (
            <ActionRow
              icon="log-in"
              label="Sign in"
              description="Open authentication"
              iconColor="#A5F3FC"
              onPress={() => {
                signOut();
              }}
              isLast
            />
          )}
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>UPCOMING</Text>
        </View>

        <View style={styles.card}>
          <UpcomingBlock
            title="Tomorrow"
            sectionKey="tomorrow"
            items={tomorrowItems}
            onOpenItem={openItem}
            isExpanded={expandedUpcomingSection === "tomorrow"}
            onViewAll={() => setExpandedUpcomingSection("tomorrow")}
            onCollapse={() => setExpandedUpcomingSection(null)}
          />

          <UpcomingBlock
            title="This Week"
            sectionKey="week"
            items={weekItems}
            onOpenItem={openItem}
            isExpanded={expandedUpcomingSection === "week"}
            onViewAll={() => setExpandedUpcomingSection("week")}
            onCollapse={() => setExpandedUpcomingSection(null)}
          />

          <UpcomingBlock
            title="This Month"
            sectionKey="month"
            items={monthItems}
            onOpenItem={openItem}
            isExpanded={expandedUpcomingSection === "month"}
            onViewAll={() => setExpandedUpcomingSection("month")}
            onCollapse={() => setExpandedUpcomingSection(null)}
            isLast
          />
        </View>

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
            onPress={() =>
              openMail(SUPPORT_EMAIL, "Vexo Save — Support Request")
            }
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

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>QA DEBUG</Text>
        </View>

        <View style={styles.card}>
          <ActionRow
            icon="activity"
            label="View debug logs"
            description="TODO: remove before production."
            iconColor="#F59E0B"
            onPress={() => {
              router.push("/qa-debug");
            }}
            isLast
          />
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>ABOUT</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Image
              source={require("../../assets/images/vexo-app-icon.png")}
              style={styles.aboutAppIcon}
              resizeMode="cover"
            />

            <View style={styles.aboutText}>
              <Text style={styles.aboutAppName}>Vexo Save</Text>
              <Text style={styles.aboutVersion}>Version 1.0 · MVP</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.aboutTagline}>
            Save. Organize. Find.
            {"\n"}
            Your personal video library — always in your pocket.
          </Text>
        </View>

        <Text style={styles.footerHint}>📬 {SUPPORT_EMAIL}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  glowTopLeft: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,98,220,0.11)",
  },

  glowTopRight: {
    position: "absolute",
    top: 120,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.07)",
  },

  content: {
    paddingHorizontal: 20,
    gap: 10,
  },

  header: {
    marginBottom: 8,
  },

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

  sectionLabel: {
    paddingHorizontal: 4,
    marginTop: 6,
  },

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
  accountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CARD_BG,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  accountEmail: {
    marginTop: 2,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  upcomingBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CARD_BG,
  },

  upcomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  upcomingTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },

  upcomingCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.40)",
  },

  upcomingExpandedSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
  },

  upcomingEmpty: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },

  upcomingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },

  upcomingItemPressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  upcomingDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#8B5CF6",
    marginTop: 6,
  },

  upcomingItemText: {
    flex: 1,
  },

  upcomingItemTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.88)",
  },

  upcomingItemMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.38)",
    marginTop: 2,
  },

  upcomingToggleButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  upcomingToggleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.78)",
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

  actionText: {
    flex: 1,
    gap: 2,
  },

  actionLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
  },

  actionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.38)",
  },

  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: CARD_BG,
  },

  aboutAppIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },

  aboutText: {
    flex: 1,
  },

  aboutAppName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  aboutVersion: {
    marginTop: 2,
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
  },

  aboutTagline: {
    padding: 16,
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    backgroundColor: CARD_BG,
  },

  footerHint: {
    textAlign: "center",
    marginTop: 14,
    color: "rgba(255,255,255,0.28)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});