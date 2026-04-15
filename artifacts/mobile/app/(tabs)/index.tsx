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

const BG = "#0B0B12";

export default function HomeScreen() {
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

  const sectionLabel = searchQuery.trim()
    ? `Results for "${searchQuery}"`
    : selectedCategory !== "All"
    ? selectedCategory
    : "Recent Saved";

  return (
    <View style={styles.container}>
      <FlatList
        data={[1]}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: topPadding + 14 }]}>
              <LinearGradient
                colors={["#7C5CFF18", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.titleRow}>
                    <Text style={styles.titleWhite}>Vexo</Text>
                    <Text style={styles.titleAccent}> Save</Text>
                  </View>
                  <Text style={styles.tagline}>Save. Organize. Find.</Text>
                </View>
                <VexoLogo height={72} />
              </View>

              <View style={styles.searchWrap}>
                <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
              </View>
            </View>

            {/* ── Category chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {categoryList.map((name, idx) => (
                <View
                  key={name}
                  style={{
                    marginLeft: idx === 0 ? 20 : 6,
                    marginRight: idx === categoryList.length - 1 ? 20 : 0,
                  }}
                >
                  <CategoryChip
                    label={name}
                    color={name === "All" ? "#7C5CFF" : categoryColorMap[name]}
                    selected={selectedCategory === name}
                    onPress={() => setSelectedCategory(name)}
                  />
                </View>
              ))}
            </ScrollView>

            {/* ── Section label ── */}
            {!isGlobalEmpty && (
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>{sectionLabel}</Text>
                {!isEmpty && (
                  <Text style={styles.sectionCount}>{displayedItems.length}</Text>
                )}
              </View>
            )}
          </View>
        }
        renderItem={() => (
          <View style={styles.gridWrap}>
            {isEmpty ? (
              isGlobalEmpty ? (
                <GlobalEmptyState onAdd={() => router.push("/add")} />
              ) : (
                <FilteredEmptyState
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  onAdd={() => router.push("/add")}
                  onClear={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                />
              )
            ) : (
              <View style={styles.grid}>
                <View style={styles.column}>
                  {leftColumn.map((item, idx) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      isLarge={idx % 3 === 0}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  ))}
                </View>
                <View style={styles.column}>
                  {rightColumn.map((item, idx) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      isLarge={idx % 3 === 1}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      />
      <FloatingAddButton onPress={() => router.push("/add")} bottomOffset={bottomPadding - 40} />
    </View>
  );
}

function GlobalEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={emptyS.wrap}>
      <LinearGradient
        colors={["#7C5CFF22", "#4CC9F010"]}
        style={emptyS.iconRing}
      >
        <Feather name="bookmark" size={34} color="#7C5CFF" style={{ opacity: 0.85 }} />
      </LinearGradient>
      <Text style={emptyS.title}>Your library is empty</Text>
      <Text style={emptyS.desc}>
        Save your first video from YouTube,{"\n"}TikTok, or Instagram.
      </Text>
      <Pressable onPress={onAdd} style={({ pressed }) => [emptyS.cta, { opacity: pressed ? 0.8 : 1 }]}>
        <LinearGradient
          colors={["#7C5CFF", "#4CC9F0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={emptyS.ctaGrad}
        >
          <Feather name="plus" size={15} color="#fff" />
          <Text style={emptyS.ctaText}>Save your first video</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function FilteredEmptyState({
  selectedCategory, searchQuery, onAdd, onClear,
}: {
  selectedCategory: string;
  searchQuery: string;
  onAdd: () => void;
  onClear: () => void;
}) {
  const isSearch = !!searchQuery.trim();
  return (
    <View style={emptyS.wrap}>
      <View style={emptyS.iconRingDark}>
        <Feather name={isSearch ? "search" : "folder"} size={30} color="#4A5170" />
      </View>
      <Text style={emptyS.title}>
        {isSearch ? "No results found" : `No ${selectedCategory} videos`}
      </Text>
      <Text style={emptyS.desc}>
        {isSearch
          ? `Nothing matched "${searchQuery}"`
          : `No ${selectedCategory} videos saved yet`}
      </Text>
      <View style={emptyS.row}>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [emptyS.secondary, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={emptyS.secondaryText}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [emptyS.cta, { flex: 1, opacity: pressed ? 0.8 : 1 }]}
        >
          <LinearGradient
            colors={["#7C5CFF", "#4CC9F0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={emptyS.ctaGrad}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={emptyS.ctaText}>Add video</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const emptyS = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 72,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconRingDark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#11131F",
    borderWidth: 1,
    borderColor: "#1A1B2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
    textAlign: "center",
    color: "#FFFFFF",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    color: "#9CA3AF",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
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
    paddingVertical: 14,
    gap: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  secondary: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A1B2E",
    backgroundColor: "#11131F",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  titleWhite: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.4,
    color: "#FFFFFF",
  },
  titleAccent: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.4,
    color: "#7C5CFF",
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2E3350",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  searchWrap: {
    marginTop: 20,
  },
  chipsScroll: {
    marginTop: 16,
    marginBottom: 4,
  },
  chipsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#2A2E45",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#252840",
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
