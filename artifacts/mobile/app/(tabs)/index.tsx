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

const BG = "#0B0B12";
const SURFACE = "#11131F";
const BORDER = "#1A1B2E";

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
                colors={["#7C5CFF14", "transparent"]}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Top row: logo + search icon */}
              <View style={styles.headerTop}>
                <VexoLogo height={28} />
                <Pressable
                  onPress={searchOpen ? closeSearch : openSearch}
                  style={[styles.searchIconBtn, searchOpen && styles.searchIconBtnActive]}
                  hitSlop={8}
                >
                  <Feather
                    name={searchOpen ? "x" : "search"}
                    size={17}
                    color={searchOpen ? "#7C5CFF" : "#9CA3AF"}
                  />
                </Pressable>
              </View>

              {/* Title block */}
              <View style={styles.titleBlock}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.mainTitle}>Your Library</Text>
              </View>

              {/* Collapsible search bar */}
              <Animated.View style={[styles.searchWrap, { height: searchBarHeight, opacity: searchBarOpacity }]}>
                <View style={styles.searchInner}>
                  <Feather name="search" size={14} color="#4A5170" />
                  <TextInput
                    ref={searchRef}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search saved videos..."
                    placeholderTextColor="#4A5170"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                      <Feather name="x-circle" size={14} color="#4A5170" />
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
                  style={{
                    marginLeft: idx === 0 ? 20 : 6,
                    marginRight: 0,
                  }}
                >
                  <CategoryChip
                    label={name}
                    color={name === "All" ? "#7C5CFF" : categoryColorMap[name]}
                    selected={selectedCategory === name}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(name);
                    }}
                  />
                </View>
              ))}
              {/* + New chip */}
              <View style={{ marginLeft: 6, marginRight: 20 }}>
                <Pressable
                  onPress={() => router.push("/add")}
                  style={styles.addChip}
                >
                  <Feather name="plus" size={11} color="#7C5CFF" />
                  <Text style={styles.addChipText}>New</Text>
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
      <LinearGradient colors={["#7C5CFF22", "#4CC9F010"]} style={emptyS.iconRing}>
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
  wrap: { alignItems: "center", paddingTop: 72, paddingHorizontal: 32, gap: 12 },
  iconRing: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  iconRingDark: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#11131F", borderWidth: 1, borderColor: "#1A1B2E", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, textAlign: "center", color: "#FFFFFF" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, color: "#9CA3AF" },
  row: { flexDirection: "row", gap: 8, marginTop: 6, alignSelf: "stretch" },
  cta: { borderRadius: 14, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 6 },
  ctaText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  secondary: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#1A1B2E", backgroundColor: "#11131F", alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#9CA3AF" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
    gap: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconBtnActive: {
    backgroundColor: "#7C5CFF14",
    borderColor: "#7C5CFF40",
  },

  titleBlock: {
    gap: 2,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#4A5170",
    letterSpacing: 0.2,
  },
  mainTitle: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.6,
    color: "#FFFFFF",
  },

  searchWrap: {
    overflow: "hidden",
    marginTop: 12,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
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

  chipsScroll: { marginTop: 18, marginBottom: 2 },
  chipsContent: { flexDirection: "row", alignItems: "center" },

  addChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#7C5CFF12",
    borderWidth: 1,
    borderColor: "#7C5CFF30",
    gap: 5,
  },
  addChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#7C5CFF",
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
    color: "#2A2E45",
    letterSpacing: 1.1,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#252840",
  },

  gridWrap: { paddingHorizontal: 14 },
  grid: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
});
