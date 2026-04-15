import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryChip } from "@/components/CategoryChip";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { SearchBar } from "@/components/SearchBar";
import { VideoCard } from "@/components/VideoCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, categories, searchItems } = useSavedItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  const displayedItems = useMemo(() => {
    let list = searchQuery.trim() ? searchItems(searchQuery) : items;
    if (selectedCategory !== "All") {
      list = list.filter((i) => i.category === selectedCategory);
    }
    return list;
  }, [items, searchQuery, selectedCategory, searchItems]);

  const leftColumn = useMemo(() => displayedItems.filter((_, i) => i % 2 === 0), [displayedItems]);
  const rightColumn = useMemo(() => displayedItems.filter((_, i) => i % 2 === 1), [displayedItems]);

  const categoryList = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories]);
  const categoryColorMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.name, c.color])),
    [categories]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[1]}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View style={{ paddingTop: topPadding + 8 }}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.appName, { color: colors.foreground }]}>Vexo Save</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {items.length} videos saved
                </Text>
              </View>
              <LinearGradient
                colors={["#9B72F7", "#5B6BF8", "#06B6D4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoLetter}>V</Text>
              </LinearGradient>
            </View>

            <View style={styles.searchWrap}>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              {categoryList.map((name) => (
                <CategoryChip
                  key={name}
                  label={name}
                  color={name === "All" ? colors.primary : categoryColorMap[name]}
                  selected={selectedCategory === name}
                  onPress={() => setSelectedCategory(name)}
                />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={() => (
          <View style={styles.gridWrap}>
            {displayedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>—</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {searchQuery ? "No results" : `No ${selectedCategory === "All" ? "saved videos" : selectedCategory + " videos"} yet`}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {searchQuery ? "Try a different search term" : "Tap + to save your first video"}
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
          </View>
        )}
      />
      <FloatingAddButton
        onPress={() => router.push("/add")}
        bottomOffset={bottomPadding - 40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  logoGradient: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chipsScroll: {
    marginBottom: 14,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 7,
    flexDirection: "row",
  },
  gridWrap: {
    paddingHorizontal: 16,
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
    paddingTop: 70,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
