import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VideoCard } from "@/components/VideoCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

export default function CategoryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, items } = useSavedItems();

  const category = categories.find((c) => c.id === id);
  const categoryItems = useMemo(
    () => (category ? items.filter((i) => i.category === category.name) : []),
    [category, items]
  );

  const leftColumn = useMemo(
    () => categoryItems.filter((_, i) => i % 2 === 0),
    [categoryItems]
  );
  const rightColumn = useMemo(
    () => categoryItems.filter((_, i) => i % 2 === 1),
    [categoryItems]
  );

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Category not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[1]}
        keyExtractor={() => "grid"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        renderItem={() => (
          <>
            <View style={styles.headerInfo}>
              <View style={[styles.iconWrap, { backgroundColor: category.color + "22" }]}>
                <Feather name={category.icon as any} size={28} color={category.color} />
              </View>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {categoryItems.length} {categoryItems.length === 1 ? "video" : "videos"}
              </Text>
            </View>

            {categoryItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="video-off" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No videos yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Save videos to this category
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                <View style={styles.column}>
                  {leftColumn.map((item, index) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      isLarge={index % 3 === 0}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  ))}
                </View>
                <View style={styles.column}>
                  {rightColumn.map((item, index) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      isLarge={index % 3 === 1}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  headerInfo: {
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
