import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryChip } from "@/components/CategoryChip";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { VexoLogo } from "@/components/VexoLogo";
import { VideoCard } from "@/components/VideoCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#060814";
const BORDER = "rgba(255,255,255,0.10)";
const CARD_BG = "rgba(255,255,255,0.04)";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, categories, searchItems } = useSavedItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchRef = useRef<TextInput>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  function openSearch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchOpen(true);
    Animated.spring(searchAnim, { toValue: 1, useNativeDriver: false, speed: 22, bounciness: 4 }).start();
    setTimeout(() => searchRef.current?.focus(), 80);
  }

  function closeSearch() {
    setSearchQuery("");
    Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false, speed: 22, bounciness: 0 }).start(() => {
      setSearchOpen(false);
    });
  }

  const searchBarHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const searchBarOpacity = searchAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

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

  const isEmpty = displayedItems.length === 0;
  const isGlobalEmpty = items.length === 0;

  const sectionLabel = searchQuery.trim()
    ? `Results for "${searchQuery}"`
    : selectedCategory !== "All"
    ? selectedCategory
    : "Recent Saved";

  return (
    <View style={styles.container}>
      {/* Ambient glow blobs */}
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowTopRight} pointerEvents="none" />

      <FlatList
        data={[1]}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: topPadding + 14 }]}>
              {/* Title row: "Vexo Save" left, logo right */}
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Text style={styles.mainTitle}>
                    <Text style={styles.titleWhite}>Vexo</Text>
                    <Text style={styles.titleAccent}> Save</Text>
                  </Text>
                </View>
                <VexoLogo height={64} />
              </View>

              {/* Tagline + search icon */}
              <View style={styles.headerBottom}>
                <Text style={styles.tagline}>Save. Organize. Find.</Text>
                <Pressable
                  onPress={searchOpen ? closeSearch : openSearch}
                  style={[styles.searchIconBtn, searchOpen && styles.searchIconBtnActive]}
                  hitSlop={8}
                >
                  <Feather
                    name={searchOpen ? "x" : "search"}
                    size={17}
                    color={searchOpen ? "#A5F3FC" : "rgba(255,255,255,0.80)"}
                  />
                </Pressable>
              </View>

              {/* Collapsible search bar */}
              <Animated.View style={[styles.searchWrap, { height: searchBarHeight, opacity: searchBarOpacity }]}>
                <View style={styles.searchInner}>
                  <Feather name="search" size={14} color="rgba(255,255,255,0.35)" />
                  <TextInput
                    ref={searchRef}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search saved videos..."
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                      <Feather name="x-circle" size={14} color="rgba(255,255,255,0.35)" />
                    </Pressable>
                  )}
                </View>
              </Animated.View>
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
                  style={{ marginLeft: idx === 0 ? 20 : 8, marginRight: 0 }}
                >
                  <CategoryChip
                    label={name}
                    selected={selectedCategory === name}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(name);
                    }}
                  />
                </View>
              ))}
              {/* + Add dashed chip */}
              <View style={{ marginLeft: 8, marginRight: 20 }}>
                <Pressable
                  onPress={() => router.push("/add")}
                  style={styles.addChip}
                >
                  <Text style={styles.addChipText}>+ Add</Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* ── Section label ── */}
            {!isGlobalEmpty && (
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>{sectionLabel.toUpperCase()}</Text>
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
                  onClear={() => { setSelectedCategory("All"); setSearchQuery(""); closeSearch(); }}
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
      <View style={emptyS.iconRing}>
        <Feather name="bookmark" size={32} color="#A5F3FC" style={{ opacity: 0.7 }} />
      </View>
      <Text style={emptyS.title}>Your library is empty</Text>
      <Text style={emptyS.desc}>Save your first video from YouTube,{"\n"}TikTok, or Instagram.</Text>
      <Pressable onPress={onAdd} style={({ pressed }) => [emptyS.cta, { opacity: pressed ? 0.8 : 1 }]}>
        <LinearGradient
          colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={emptyS.ctaGrad}
        >
          <Feather name="plus" size={15} color="#fff" />
          <Text style={emptyS.ctaText}>Save your first video</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function FilteredEmptyState({ selectedCategory, searchQuery, onAdd, onClear }: { selectedCategory: string; searchQuery: string; onAdd: () => void; onClear: () => void; }) {
  const isSearch = !!searchQuery.trim();
  return (
    <View style={emptyS.wrap}>
      <View style={emptyS.iconRing}>
        <Feather name={isSearch ? "search" : "folder"} size={28} color="rgba(255,255,255,0.30)" />
      </View>
      <Text style={emptyS.title}>{isSearch ? "No results found" : `No ${selectedCategory} videos`}</Text>
      <Text style={emptyS.desc}>{isSearch ? `Nothing matched "${searchQuery}"` : `No ${selectedCategory} videos saved yet`}</Text>
      <View style={emptyS.row}>
        <Pressable onPress={onClear} style={({ pressed }) => [emptyS.secondary, { opacity: pressed ? 0.8 : 1 }]}>
          <Text style={emptyS.secondaryText}>Clear</Text>
        </Pressable>
        <Pressable onPress={onAdd} style={({ pressed }) => [emptyS.cta, { flex: 1, opacity: pressed ? 0.8 : 1 }]}>
          <LinearGradient colors={["#D946EF", "#8B5CF6", "#22D3EE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={emptyS.ctaGrad}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={emptyS.ctaText}>Add video</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const emptyS = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 72, paddingHorizontal: 32, gap: 12 },
  iconRing: { width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, textAlign: "center", color: "#FFFFFF" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, color: "rgba(255,255,255,0.55)" },
  row: { flexDirection: "row", gap: 8, marginTop: 6, alignSelf: "stretch" },
  cta: { borderRadius: 16, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 6 },
  ctaText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  secondary: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.60)" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  glowTopLeft: {
    position: "absolute",
    top: -40,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(217,70,239,0.12)",
  },
  glowTopRight: {
    position: "absolute",
    top: 120,
    right: -30,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(34,211,238,0.06)",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  mainTitle: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.8,
    includeFontPadding: false,
  },
  titleWhite: { color: "#FFFFFF" },
  titleAccent: { color: "#8B5CF6" },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.1,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconBtnActive: {
    backgroundColor: "rgba(34,211,238,0.08)",
    borderColor: "rgba(34,211,238,0.30)",
  },

  searchWrap: { overflow: "hidden", marginTop: 12 },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    paddingVertical: 0,
  },

  chipsScroll: { marginTop: 16, marginBottom: 2 },
  chipsContent: { flexDirection: "row", alignItems: "center" },

  addChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
  },
  addChipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#A5F3FC",
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.20)",
  },

  gridWrap: { paddingHorizontal: 14 },
  grid: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
});
