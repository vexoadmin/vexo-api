import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
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

  const isEmpty = displayedItems.length === 0;
  const isGlobalEmpty = items.length === 0;

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
                  {items.length} {items.length === 1 ? "video" : "videos"} saved
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
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
            >
              {categoryList.map((name, idx) => (
                <View
                  key={name}
                  style={{ marginLeft: idx === 0 ? 16 : 7, marginRight: idx === categoryList.length - 1 ? 16 : 0 }}
                >
                  <CategoryChip
                    label={name}
                    color={name === "All" ? "#9B72F7" : categoryColorMap[name]}
                    selected={selectedCategory === name}
                    onPress={() => setSelectedCategory(name)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={() => (
          <View style={styles.gridWrap}>
            {isEmpty ? (
              isGlobalEmpty ? (
                <GlobalEmptyState colors={colors} onAdd={() => router.push("/add")} />
              ) : (
                <FilteredEmptyState
                  colors={colors}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  onAdd={() => router.push("/add")}
                  onClear={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                />
              )
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

function GlobalEmptyState({ colors, onAdd }: { colors: any; onAdd: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconRing, { backgroundColor: "#8B5CF6" + "12", borderColor: "#8B5CF6" + "28" }]}>
        <Feather name="bookmark" size={38} color="#8B5CF6" style={{ opacity: 0.7 }} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        No saved videos yet
      </Text>
      <Text style={[emptyStyles.desc, { color: colors.mutedForeground }]}>
        Start building your collection.{"\n"}Paste a YouTube, TikTok, or Instagram link to save it.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          emptyStyles.cta,
          { backgroundColor: "#8B5CF6", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="plus" size={16} color="#fff" />
        <Text style={emptyStyles.ctaText}>Save your first video</Text>
      </Pressable>
    </View>
  );
}

function FilteredEmptyState({
  colors,
  selectedCategory,
  searchQuery,
  onAdd,
  onClear,
}: {
  colors: any;
  selectedCategory: string;
  searchQuery: string;
  onAdd: () => void;
  onClear: () => void;
}) {
  const isSearch = !!searchQuery.trim();

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconRing, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather
          name={isSearch ? "search" : "folder"}
          size={34}
          color={colors.mutedForeground}
          style={{ opacity: 0.6 }}
        />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        {isSearch ? "No results found" : `No ${selectedCategory} videos`}
      </Text>
      <Text style={[emptyStyles.desc, { color: colors.mutedForeground }]}>
        {isSearch
          ? `Nothing matched "${searchQuery}". Try a different keyword.`
          : `You haven't saved any ${selectedCategory} videos yet.`}
      </Text>
      <View style={emptyStyles.row}>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            emptyStyles.secondaryCta,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[emptyStyles.secondaryCtaText, { color: colors.mutedForeground }]}>Clear filter</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            emptyStyles.cta,
            { backgroundColor: "#8B5CF6", opacity: pressed ? 0.85 : 1, flex: 1 },
          ]}
        >
          <Feather name="plus" size={15} color="#fff" />
          <Text style={emptyStyles.ctaText}>Add video</Text>
        </Pressable>
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 28,
    gap: 12,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    alignSelf: "stretch",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 7,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryCta: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCtaText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

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
    flexDirection: "row",
    alignItems: "center",
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
});
