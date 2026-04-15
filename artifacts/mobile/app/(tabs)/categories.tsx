import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryCard } from "@/components/CategoryCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS = ["#8B5CF6", "#3B82F6", "#06B6D4", "#F97316", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];
const CATEGORY_ICONS = ["folder", "heart", "star", "film", "coffee", "globe", "zap", "activity"];

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, items, addCategory } = useSavedItems();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState(0);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  function handleAdd() {
    if (!newName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategory({
      name: newName.trim(),
      color: CATEGORY_COLORS[selectedColor],
      icon: CATEGORY_ICONS[selectedIcon],
    });
    setNewName("");
    setShowAdd(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 8, paddingBottom: bottomPadding },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>Categories</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {categories.length} collections
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAdd(!showAdd);
                }}
                style={[styles.addBtn, { backgroundColor: showAdd ? colors.primary + "33" : colors.secondary, borderColor: showAdd ? colors.primary + "55" : colors.border }]}
              >
                <Feather name={showAdd ? "x" : "plus"} size={18} color={showAdd ? colors.primary : colors.mutedForeground} />
              </Pressable>
            </View>

            {showAdd && (
              <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Category name..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
                  autoFocus
                />
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Color</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_COLORS.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(i)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: c },
                        selectedColor === i && { borderWidth: 2.5, borderColor: "#fff" },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Icon</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_ICONS.map((icon, i) => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(i)}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: selectedIcon === i ? CATEGORY_COLORS[selectedColor] + "25" : colors.secondary,
                          borderColor: selectedIcon === i ? CATEGORY_COLORS[selectedColor] + "66" : colors.border,
                        },
                      ]}
                    >
                      <Feather
                        name={icon as any}
                        size={17}
                        color={selectedIcon === i ? CATEGORY_COLORS[selectedColor] : colors.mutedForeground}
                      />
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={handleAdd} style={{ borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
                  <LinearGradient
                    colors={["#9B72F7", "#5B6BF8", "#06B6D4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveBtnText}>Create Category</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              ALL COLLECTIONS
            </Text>
          </>
        }
        renderItem={({ item: category }) => (
          <CategoryCard
            category={category}
            itemCount={categoryItemCounts[category.name] || 0}
            onPress={() => router.push(`/category/${category.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No categories yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap + to create your first collection
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addForm: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderRadius: 11,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  saveBtnGradient: {
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
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
