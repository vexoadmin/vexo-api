import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ title: "Category" }} />
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Category not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: category.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
        }}
      />

      <FlatList
        data={[1]}
        keyExtractor={() => "grid"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={[category.color + "22", category.color + "08", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroBanner, { borderColor: category.color + "20" }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: category.color + "20" }]}>
                <Feather name={category.icon as any} size={32} color={category.color} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, { color: colors.foreground }]}>
                  {category.name}
                </Text>
                <Text style={[styles.heroCount, { color: colors.mutedForeground }]}>
                  {categoryItems.length} {categoryItems.length === 1 ? "video" : "videos"} saved
                </Text>
              </View>
            </LinearGradient>

            {categoryItems.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                ALL VIDEOS
              </Text>
            )}
          </>
        }
        renderItem={() =>
          categoryItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconRing, { backgroundColor: category.color + "12", borderColor: category.color + "25" }]}>
                <Feather name={category.icon as any} size={34} color={category.color + "88"} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No {category.name} videos yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Save a video and tag it as{" "}
                <Text style={{ color: category.color, fontFamily: "Inter_500Medium" }}>
                  {category.name}
                </Text>{" "}
                to see it here.
              </Text>
              <Pressable
                onPress={() => router.push("/add")}
                style={[styles.addFirstBtn, { backgroundColor: category.color + "18", borderColor: category.color + "40" }]}
              >
                <Feather name="plus" size={15} color={category.color} />
                <Text style={[styles.addFirstBtnText, { color: category.color }]}>
                  Save a video
                </Text>
              </Pressable>
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
          )
        }
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
    paddingTop: 12,
    gap: 12,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    gap: 3,
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  heroCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 2,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  addFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    marginTop: 4,
  },
  addFirstBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 10,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
