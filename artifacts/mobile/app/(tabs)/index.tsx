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
import { VexoLogo } from "@/components/VexoLogo";
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

  const leftColumn = useMemo(
    () => displayedItems.filter((_, i) => i % 2 === 0),
    [displayedItems]
  );
  const rightColumn = useMemo(
    () => displayedItems.filter((_, i) => i % 2 === 1),
    [displayedItems]
  );

  const categoryList = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories]
  );
  const categoryColorMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.name, c.color])),
    [categories]
  );

  const isEmpty = displayedItems.length === 0;
  const isGlobalEmpty = items.length === 0;

  const sectionLabel =
    searchQuery.trim()
      ? `Results for "${searchQuery}"`
      : selectedCategory !== "All"
      ? selectedCategory
      : "Recent Saved";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[1]}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={[styles.headerWrap, { paddingTop: topPadding + 10 }]}>
              {/* Multi-layer gradient glow */}
              <LinearGradient
                colors={["#784BEA22", "#6466EF10", "#07091A00"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <LinearGradient
                colors={["#A56BF714", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Title row */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.titleRow}>
                    <Text style={styles.titleVexo}>Vexo</Text>
                    <Text style={styles.titleSave}> Save</Text>
                  </View>
                  <Text style={styles.tagline}>Save. Organize. Find.</Text>
                </View>

                <VexoLogo height={46} />
              </View>

              {/* Search */}
              <View style={styles.searchWrap}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* ── Category chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
            >
              {categoryList.map((name, idx) => (
                <View
                  key={name}
                  style={{
                    marginLeft: idx === 0 ? 16 : 6,
                    marginRight: idx === categoryList.length - 1 ? 16 : 0,
                  }}
                >
                  <CategoryChip
                    label={name}
                    color={name === "All" ? "#784BEA" : categoryColorMap[name]}
                    selected={selectedCategory === name}
                    onPress={() => setSelectedCategory(name)}
                  />
                </View>
              ))}
            </ScrollView>

            {/* ── Section header ── */}
            {!isGlobalEmpty && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{sectionLabel}</Text>
                {!isEmpty && (
                  <Text style={styles.sectionCount}>
                    {displayedItems.length}
                  </Text>
                )}
              </View>
            )}
          </View>
        }
        renderItem={() => (
          <View style={styles.gridWrap}>
            {isEmpty ? (
              isGlobalEmpty ? (
                <GlobalEmptyState
                  colors={colors}
                  onAdd={() => router.push("/add")}
                />
              ) : (
                <FilteredEmptyState
                  colors={colors}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  onAdd={() => router.push("/add")}
                  onClear={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
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

function GlobalEmptyState({
  colors,
  onAdd,
}: {
  colors: any;
  onAdd: () => void;
}) {
  return (
    <View style={emptyStyles.container}>
      <LinearGradient
        colors={["#784BEA20", "#6466EF10"]}
        style={emptyStyles.iconRing}
      >
        <Feather
          name="bookmark"
          size={36}
          color="#784BEA"
          style={{ opacity: 0.8 }}
        />
      </LinearGradient>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        Your library is empty
      </Text>
      <Text style={[emptyStyles.desc, { color: colors.mutedForeground }]}>
        Save your first video from YouTube,{"\n"}TikTok, or Instagram.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [emptyStyles.cta, { opacity: pressed ? 0.8 : 1 }]}
      >
        <LinearGradient
          colors={["#6466EF", "#784BEA", "#A56BF7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={emptyStyles.ctaGrad}
        >
          <Feather name="plus" size={15} color="#fff" />
          <Text style={emptyStyles.ctaText}>Save your first video</Text>
        </LinearGradient>
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
      <View
        style={[
          emptyStyles.iconRing,
          { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        <Feather
          name={isSearch ? "search" : "folder"}
          size={32}
          color={colors.mutedForeground}
          style={{ opacity: 0.5 }}
        />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        {isSearch ? "No results" : `No ${selectedCategory} videos`}
      </Text>
      <Text style={[emptyStyles.desc, { color: colors.mutedForeground }]}>
        {isSearch
          ? `Nothing matched "${searchQuery}".`
          : `No ${selectedCategory} videos saved yet.`}
      </Text>
      <View style={emptyStyles.row}>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            emptyStyles.secondary,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[emptyStyles.secondaryText, { color: colors.mutedForeground }]}>
            Clear
          </Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            emptyStyles.cta,
            { flex: 1, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#6466EF", "#784BEA", "#A56BF7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={emptyStyles.ctaGrad}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={emptyStyles.ctaText}>Add video</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 28,
    gap: 12,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
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
    marginTop: 6,
    alignSelf: "stretch",
  },
  cta: {
    borderRadius: 13,
    overflow: "hidden",
  },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  secondary: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  titleVexo: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.2,
    color: "#ECEEFF",
  },
  titleSave: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.2,
    color: "#9B7EFA",
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#3A4260",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  searchWrap: {
    marginTop: 18,
  },

  chipsScroll: {
    marginTop: 14,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#2E3452",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#252B46",
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
