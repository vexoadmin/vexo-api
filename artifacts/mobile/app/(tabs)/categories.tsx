import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { CategoryCard } from "@/components/CategoryCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS = ["#8B5CF6", "#3B82F6", "#06B6D4", "#7C3AED", "#6366F1", "#2563EB", "#0891B2", "#4F46E5"];
const CATEGORY_ICONS = ["folder", "heart", "star", "film", "zap", "globe", "headphones", "camera"];

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
          {
            paddingTop: topPadding + 12,
            paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 100,
          },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>Categories</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAdd(!showAdd);
                }}
                style={[styles.addBtn, { backgroundColor: colors.primary + "22" }]}
              >
                <Feather name={showAdd ? "x" : "plus"} size={20} color={colors.primary} />
              </Pressable>
            </View>

            {showAdd && (
              <View style={[styles.addForm, { backgroundColor: colors.card, borderRadius: 16 }]}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Category name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderRadius: 12 }]}
                />
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_COLORS.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(i)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: c },
                        selectedColor === i && styles.colorSelected,
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Icon</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_ICONS.map((icon, i) => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(i)}
                      style={[
                        styles.iconOption,
                        { backgroundColor: selectedIcon === i ? colors.primary + "33" : colors.secondary },
                      ]}
                    >
                      <Feather name={icon as any} size={18} color={selectedIcon === i ? colors.primary : colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={handleAdd} style={styles.saveBtn}>
                  <LinearGradient
                    colors={["#8B5CF6", "#06B6D4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveBtnText}>Create Category</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
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
            <Feather name="folder" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No categories yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the + button to create one
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addForm: {
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
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
