import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingAddButton } from "@/components/FloatingAddButton";
import { SearchBar } from "@/components/SearchBar";
import { VideoCard } from "@/components/VideoCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, searchItems } = useSavedItems();
  const [searchQuery, setSearchQuery] = useState("");

  const displayedItems = useMemo(() => {
    if (searchQuery.trim()) return searchItems(searchQuery);
    return items;
  }, [items, searchQuery, searchItems]);

  const leftColumn = useMemo(
    () => displayedItems.filter((_, i) => i % 2 === 0),
    [displayedItems]
  );
  const rightColumn = useMemo(
    () => displayedItems.filter((_, i) => i % 2 === 1),
    [displayedItems]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[1]}
        keyExtractor={() => "grid"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPadding + 12,
            paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 100,
          },
        ]}
        renderItem={() => (
          <>
            <View style={styles.header}>
              <LinearGradient
                colors={["#8B5CF6", "#06B6D4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoGradient}
              >
                <Feather name="bookmark" size={20} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={[styles.appName, { color: colors.foreground }]}>Vexo Save</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {items.length} videos saved
                </Text>
              </View>
            </View>

            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

            {displayedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {searchQuery ? "No results found" : "No saved videos yet"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {searchQuery
                    ? "Try a different search term"
                    : "Tap the + button to save your first video"}
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
          </>
        )}
      />
      <FloatingAddButton onPress={() => router.push("/add")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
