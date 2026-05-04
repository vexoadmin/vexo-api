import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#040812";
const tutorialImages = [
  require("../../assets/tutorial/tutorial1.png"),
  require("../../assets/tutorial/tutorial2.png"),
  require("../../assets/tutorial/tutorial3.png"),
];
const RECOMMENDED_LINKS = [
  {
    id: "rec-yt",
    label: "YouTube example",
    url: "https://www.youtube.com/watch?v=TYvBT_TWTJk",
  },
  {
    id: "rec-recipe",
    label: "Recipe website",
    url: "https://www.10dakot.co.il/",
  },
  {
    id: "rec-article",
    label: "Article example",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    id: "rec-pinterest",
    label: "Pinterest example",
    url: "https://www.pinterest.com/",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, isHydrated, isProfileSupabaseReady, session } = useAuth();
  const { items, categories, searchItems, deleteItem } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialChecked, setTutorialChecked] = useState(false);

  const androidBottomSpace = Math.max(insets.bottom, 20);

  const tabBarHeight =
    Platform.OS === "android" ? 78 + androidBottomSpace : 76 + insets.bottom;

  const listBottomPad = tabBarHeight + 24;
  const plusBottom = tabBarHeight - 28;

  /** Logged-in: only after profile matches user and Supabase profile check finished. Guest: explicit signed-out (no user, no session). */
  const isClearlyNotLoggedIn =
    isHydrated && !user && !session;
  const hasConfirmedProfileForUser =
    Boolean(
      user &&
        profile &&
        profile.id &&
        user.id &&
        profile.id === user.id &&
        isProfileSupabaseReady,
    );
  const isReadyForTutorialCheck = isClearlyNotLoggedIn || hasConfirmedProfileForUser;

  const displayedItems = useMemo(() => {
    let list = searchQuery.trim() ? searchItems(searchQuery) : items;

    if (selectedCategory !== "All") {
      list = list.filter((i) => i.category === selectedCategory);
    }

    return list;
  }, [items, searchQuery, selectedCategory, searchItems]);

  useEffect(() => {
    console.log("[UI] items received:", items);
  }, [items]);

  const leftColumn = displayedItems.filter((_, i) => i % 2 === 0);
  const rightColumn = displayedItems.filter((_, i) => i % 2 === 1);

  const categoryList = ["All", ...categories.map((c) => c.name)];
  const hasAnyItems = items.length > 0;
  const isFilteredEmpty = displayedItems.length === 0 && hasAnyItems;
  const isFirstTimeEmpty =
    displayedItems.length === 0 && !hasAnyItems && searchQuery.trim().length === 0
    && selectedCategory === "All";

  useEffect(() => {
    console.log("[UI] items received count:", items.length);
    console.log("[UI] displayedItems count:", displayedItems.length);
    console.log("[UI] hasAnyItems:", hasAnyItems);
    console.log("[UI] isFirstTimeEmpty:", isFirstTimeEmpty);
    console.log("[UI] search query/filter state:", {
      searchQuery,
      selectedCategory,
    });
  }, [items.length, displayedItems.length, hasAnyItems, isFirstTimeEmpty, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!isReadyForTutorialCheck) {
      setShowTutorial(false);
      setTutorialChecked(false);
      return;
    }
    const key = hasConfirmedProfileForUser
      ? `vexo_tutorial_seen:${profile!.id}`
      : isClearlyNotLoggedIn
        ? `vexo_tutorial_seen:guest`
        : null;

    if (!key) {
      setShowTutorial(false);
      setTutorialChecked(false);
      return;
    }

    setTutorialChecked(false);
    void AsyncStorage.getItem(key)
      .then((stored) => {
        if (!stored) {
          setTutorialStep(0);
          setShowTutorial(true);
        } else {
          setShowTutorial(false);
        }
      })
      .catch(() => {
        setShowTutorial(false);
      })
      .finally(() => {
        setTutorialChecked(true);
      });
  }, [
    isReadyForTutorialCheck,
    hasConfirmedProfileForUser,
    isClearlyNotLoggedIn,
    user?.id,
    profile?.id,
  ]);

  async function dismissTutorial() {
    const key = hasConfirmedProfileForUser
      ? `vexo_tutorial_seen:${profile!.id}`
      : isClearlyNotLoggedIn
        ? `vexo_tutorial_seen:guest`
        : null;
    if (!key) {
      setShowTutorial(false);
      return;
    }
    try {
      await AsyncStorage.setItem(key, "1");
    } catch {
      // keep app usable even when storage fails
    }
    setShowTutorial(false);
  }

  function nextTutorialStep() {
    if (tutorialStep >= tutorialImages.length - 1) {
      void dismissTutorial();
      return;
    }
    setTutorialStep((prev) => Math.min(prev + 1, tutorialImages.length - 1));
  }

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
            {isFilteredEmpty ? (
              <>
                <Text style={styles.emptyText}>No links found</Text>
                <Text style={styles.emptySubtext}>
                  Try a different search or category
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>No saves yet</Text>
                <Text style={styles.emptySubtext}>Paste a link to get started</Text>
                <Pressable
                  onPress={() => router.push("/add")}
                  style={({ pressed }) => [
                    styles.emptyPrimaryBtn,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                >
                  <LinearGradient
                    colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyPrimaryBtnInner}
                  >
                    <Text style={styles.emptyPrimaryBtnText}>Add your first link</Text>
                  </LinearGradient>
                </Pressable>
                <View style={styles.recommendedWrap}>
                  <Text style={styles.recommendedTitle}>Recommended</Text>
                  {RECOMMENDED_LINKS.map((rec) => (
                    <Pressable
                      key={rec.id}
                      onPress={() =>
                        router.push({
                          pathname: "/add",
                          params: { url: rec.url },
                        })
                      }
                      style={({ pressed }) => [
                        styles.recommendedItem,
                        pressed ? { opacity: 0.85 } : null,
                      ]}
                    >
                      <Text style={styles.recommendedLabel}>{rec.label}</Text>
                      <Text style={styles.recommendedUrl} numberOfLines={1}>
                        {rec.url}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
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

      {!selectionMode && !(tutorialChecked && showTutorial) ? (
        <FloatingAddButton
          onPress={() => router.push("/add")}
          bottomOffset={plusBottom}
        />
      ) : null}

      {tutorialChecked && showTutorial ? (
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialCard}>
            <LinearGradient
              colors={["rgba(217,70,239,0.16)", "rgba(34,211,238,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tutorialAccent}
            />
            <Text style={styles.tutorialTitle}>Welcome to Vexo Save</Text>
            <Image
              source={tutorialImages[tutorialStep]}
              style={styles.tutorialImage}
              resizeMode="contain"
            />
            <Text style={styles.tutorialDots}>
              {tutorialImages
                .map((_, idx) => (idx === tutorialStep ? "●" : "○"))
                .join(" ")}
            </Text>

            <View style={styles.tutorialActions}>
              <Pressable onPress={dismissTutorial} style={styles.tutorialSkipBtn}>
                <Text style={styles.tutorialSkipBtnText}>Skip</Text>
              </Pressable>
              <Pressable onPress={nextTutorialStep} style={styles.tutorialBtn}>
                <Text style={styles.tutorialBtnText}>
                  {tutorialStep < tutorialImages.length - 1 ? "Next" : "Got it"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  emptyPrimaryBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  emptyPrimaryBtnInner: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  recommendedWrap: {
    marginTop: 18,
    width: "100%",
    gap: 8,
  },
  recommendedTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "left",
  },
  recommendedItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  recommendedLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "left",
  },
  recommendedUrl: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "left",
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,18,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tutorialCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(9,14,28,0.96)",
    padding: 12,
    gap: 8,
    overflow: "hidden",
  },
  tutorialAccent: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  tutorialTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  tutorialImage: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#0B0F1A",
  },
  tutorialDots: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: -6,
  },
  tutorialActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  tutorialSkipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tutorialSkipBtnText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  tutorialBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.34)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.45)",
  },
  tutorialBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});