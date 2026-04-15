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
          <View>
            <View style={[styles.headerGlow, { paddingTop: topPadding + 12 }]}>
              <LinearGradient
                colors={["#784BEA18", "#6466EF0A", "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.headerRow}>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.titleVexo}>Vexo</Text>
                    <Text style={styles.titleSave}> Save</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                    {items.length} {items.length === 1 ? "video" : "videos"} in your library
                  </Text>
                </View>
                <VexoLogo size={46} />
              </View>

              <View style={styles.searchWrap}>
                <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
              </View>
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
                  style={{
                    marginLeft: idx === 0 ? 16 : 8,
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
      <LinearGradient
        colors={["#784BEA20", "#6466EF10"]}
        style={emptyStyles.iconRing}
      >
        <Feather name="bookmark" size={38} color="#A56BF7" style={{ opacity: 0.85 }} />
      </LinearGradient>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>Your library is empty</Text>
      <Text style={[emptyStyles.desc, { color: colors.mutedForeground }]}>
        Save your first video from YouTube,{"\n"}TikTok, or Instagram.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [emptyStyles.cta, { opacity: pressed ? 0.82 : 1 }]}
      >
        <LinearGradient
          colors={["#6466EF", "#784BEA", "#A56BF7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={emptyStyles.ctaGrad}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={emptyStyles.ctaText}>Save your first video</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function FilteredEmptyState({
  colors, selectedCategory, searchQuery, onAdd, onClear,
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
      <View style={[emptyStyles.iconRing, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}>
        <Feather
          name={isSearch ? "search" : "folder"}
          size={34}
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
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[emptyStyles.secondaryText, { color: colors.mutedForeground }]}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [emptyStyles.cta, { flex: 1, opacity: pressed ? 0.82 : 1 }]}
        >
          <LinearGradient
            colors={["#6466EF", "#784BEA", "#A56BF7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={emptyStyles.ctaGrad}
          >
            <Feather name="plus" size={15} color="#fff" />
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
    paddingTop: 60,
    paddingHorizontal: 28,
    gap: 13,
  },
  iconRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 19,
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
    marginTop: 4,
    alignSelf: "stretch",
  },
  cta: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 7,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  secondary: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
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
  headerGlow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  titleVexo: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    color: "#F0F1FF",
  },
  titleSave: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    color: "#A56BF7",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  searchWrap: {
    marginBottom: 0,
  },
  chipsScroll: {
    marginTop: 12,
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
