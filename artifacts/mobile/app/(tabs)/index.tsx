import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
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
import { VideoCard } from "@/components/VideoCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#040812";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, categories, searchItems, deleteItem } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const androidBottomSpace = Math.max(insets.bottom, 20);

  const tabBarHeight =
    Platform.OS === "android" ? 78 + androidBottomSpace : 76 + insets.bottom;

  const listBottomPad = tabBarHeight + 24;
  const plusBottom = tabBarHeight - 28;

  const displayedItems = useMemo(() => {
    let list = searchQuery.trim() ? searchItems(searchQuery) : items;

    if (selectedCategory !== "All") {
      list = list.filter((i) => i.category === selectedCategory);
    }

    return list;
  }, [items, searchQuery, selectedCategory, searchItems]);

  const leftColumn = displayedItems.filter((_, i) => i % 2 === 0);
  const rightColumn = displayedItems.filter((_, i) => i % 2 === 1);

  const categoryList = ["All", ...categories.map((c) => c.name)];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id];

      if (next.length === 0) {
        setSelectionMode(false);
      }

      return next;
    });
  }

  function startSelection(id: string) {
    setSelectionMode(true);
    setSelectedIds([id]);
  }

  function clearSelection() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  function confirmDeleteSelected() {
    if (selectedIds.length === 0) return;

    Alert.alert(
      "Delete selected",
      `Delete ${selectedIds.length} saved item${selectedIds.length === 1 ? "" : "s"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedIds.forEach((id) => deleteItem(id));
            clearSelection();
          },
        },
      ]
    );
  }

  function handleCardPress(id: string) {
    if (selectionMode) {
      toggleSelect(id);
      return;
    }

    router.push(`/item/${id}`);
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#031020", "#051120", "#040812"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgAccentTopLeft} pointerEvents="none" />
      <View style={styles.bgAccentTopRight} pointerEvents="none" />

      {selectionMode ? (
        <View style={[styles.selectionBar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={clearSelection} hitSlop={10}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.selectionTitle}>
            {selectedIds.length} selected
          </Text>

          <Pressable onPress={confirmDeleteSelected} hitSlop={10}>
            <Text style={styles.selectionDelete}>Delete</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={displayedItems.length === 0 ? [] : [1]}
        keyExtractor={() => "grid"}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        ListHeaderComponent={
          <View>
            {!selectionMode ? (
              <>
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                  <Image
                    source={require("../../assets/images/vexo-logo-muted-cropped.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.heroSubtitle}>Save. Organize. Find.</Text>

                  <View style={styles.searchWrap}>
                    <View style={styles.searchInner}>
                      <Text style={styles.searchInlineIcon}>⌕</Text>

                      <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search saved videos..."
                        placeholderTextColor="rgba(255,255,255,0.28)"
                        style={styles.searchInput}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      {searchQuery.length > 0 ? (
                        <Pressable onPress={() => setSearchQuery("")}>
                          <Text style={styles.searchClear}>×</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryRow}
                >
                  {categoryList.map((name, idx) => (
                    <View
                      key={name}
                      style={{
                        marginLeft: idx === 0 ? 20 : 8,
                      }}
                    >
                      <CategoryChip
                        label={name}
                        selected={selectedCategory === name}
                        onPress={() => setSelectedCategory(name)}
                      />
                    </View>
                  ))}
                  <View style={{ width: 20 }} />
                </ScrollView>
              </>
            ) : null}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>
                {selectionMode ? "SELECT ITEMS" : "RECENT SAVED"}
              </Text>
              <Text style={styles.sectionCount}>{displayedItems.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◌</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== "All"
                ? "No videos found"
                : "No saved videos yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== "All"
                ? "Try a different search or category"
                : 'Tap "+" to save your first video'}
            </Text>
          </View>
        }
        renderItem={() => (
          <View style={styles.grid}>
            <View style={styles.column}>
              {leftColumn.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  selectionMode={selectionMode}
                  onPress={() => handleCardPress(item.id)}
                  onLongPress={() => startSelection(item.id)}
                />
              ))}
            </View>

            <View style={styles.column}>
              {rightColumn.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  selectionMode={selectionMode}
                  onPress={() => handleCardPress(item.id)}
                  onLongPress={() => startSelection(item.id)}
                />
              ))}
            </View>
          </View>
        )}
      />

      {!selectionMode ? (
        <FloatingAddButton
          onPress={() => router.push("/add")}
          bottomOffset={plusBottom}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bgAccentTopLeft: {
    position: "absolute",
    top: -70,
    left: -40,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "rgba(116,93,230,0.12)",
  },
  bgAccentTopRight: {
    position: "absolute",
    top: 10,
    right: -55,
    width: 185,
    height: 185,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  selectionBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "rgba(5,8,20,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 30,
  },

  selectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  selectionDelete: {
    color: "#F87171",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  logoImage: {
    width: 170,
    height: 70,
    alignSelf: "flex-start",
    marginTop: 24,
    marginBottom: 14,
  },

  heroSubtitle: {
    marginTop: 0,
    marginBottom: 12,
    marginLeft: 2,
    fontSize: 15,
    lineHeight: 20,
    color: "rgba(255,255,255,0.70)",
    fontFamily: "Inter_400Regular",
  },

  searchWrap: {
    marginTop: 0,
    marginBottom: 8,
  },

  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
  },

  searchInlineIcon: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 22,
    lineHeight: 22,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    paddingVertical: 0,
    fontFamily: "Inter_400Regular",
  },

  searchClear: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 24,
    lineHeight: 24,
    marginLeft: 10,
  },

  categoryScroll: {
    marginTop: 2,
  },

  categoryRow: {
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: "center",
    paddingRight: 12,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.24)",
    letterSpacing: 1.35,
  },

  sectionCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.22)",
  },

  grid: {
    flexDirection: "row",
    paddingHorizontal: 10,
  },

  column: {
    flex: 1,
    paddingHorizontal: 3,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 84,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 42,
    color: "rgba(255,255,255,0.15)",
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.52)",
    textAlign: "center",
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.30)",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
});