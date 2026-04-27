import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SavedItem, useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  pinterest: "Pinterest",
};
const PLATFORM_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  youtube: "play-circle",
  tiktok: "video",
  instagram: "camera",
  facebook: "users",
  website: "globe",
  pinterest: "bookmark",
};
const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#EF4444",
  tiktok: "#22D3EE",
  instagram: "#D946EF",
  facebook: "#8B5CF6",
  website: "#6366F1",
  pinterest: "#E60023",
};

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function extractDomain(url: string): string {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Saved link";
  }
}

function ItemRow({
  item,
  onPress,
}: {
  item: SavedItem;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.itemCard}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailFallback}>
          <LinearGradient
            colors={["#D946EF20", "#8B5CF618", "#22D3EE1F"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.thumbnailFallbackOverlay}>
            <View
              style={[
                styles.thumbnailIconWrap,
                {
                  borderColor: `${PLATFORM_COLORS[item.platform] ?? "#8B5CF6"}60`,
                  backgroundColor: `${PLATFORM_COLORS[item.platform] ?? "#8B5CF6"}20`,
                },
              ]}
            >
              <Feather
                name={PLATFORM_ICONS[item.platform] ?? "link"}
                size={18}
                color={PLATFORM_COLORS[item.platform] ?? "#8B5CF6"}
              />
            </View>
            <Text style={styles.thumbnailFallbackText} numberOfLines={1}>
              {PLATFORM_LABELS[item.platform] ?? "Website"}
            </Text>
            <Text style={styles.thumbnailFallbackDomain} numberOfLines={1}>
              {extractDomain(item.url)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || "Untitled"}
        </Text>
        <Text style={styles.itemMeta} numberOfLines={1}>
          {item.platform.toUpperCase()} · {item.category}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.35)" />
    </Pressable>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, items } = useSavedItems();

  const categoryId = Array.isArray(id) ? id[0] : id;

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const categoryItems = useMemo(() => {
    if (!category) return [];
    const categoryKey = normalizeCategoryName(category.name);
    return items.filter(
      (item) => normalizeCategoryName(item.category) === categoryKey
    );
  }, [items, category]);

  if (!category) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.notFoundText}>Category not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#070D1A", "#070B16", BG]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={categoryItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (Platform.OS === "web" ? 30 : insets.top + 10),
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom + 24),
          },
        ]}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Feather name="arrow-left" size={26} color="#fff" />
              </Pressable>
              <Text style={styles.headerTitle}>Category</Text>
              <View style={{ width: 26 }} />
            </View>

            <View style={styles.categoryCard}>
              <View
                style={[
                  styles.categoryIconWrap,
                  {
                    backgroundColor: `${category.color}1F`,
                    borderColor: `${category.color}55`,
                  },
                ]}
              >
                <Feather
                  name={category.icon as keyof typeof Feather.glyphMap}
                  size={22}
                  color={category.color}
                />
              </View>
              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {categoryItems.length} saved item
                  {categoryItems.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={30} color="rgba(255,255,255,0.24)" />
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={styles.emptySub}>
              Save links to this category from the Add screen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ItemRow onPress={() => router.push(`/item/${item.id}`)} item={item} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20 },

  headerSection: { marginBottom: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },

  categoryCard: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTextWrap: { flex: 1 },
  categoryName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  categoryCount: {
    marginTop: 2,
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  itemCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  thumbnailFallback: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnailFallbackOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  thumbnailIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailFallbackText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  thumbnailFallbackDomain: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 8,
    fontFamily: "Inter_500Medium",
  },
  itemContent: { flex: 1, gap: 4 },
  itemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  itemMeta: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  emptyWrap: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  notFoundText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
