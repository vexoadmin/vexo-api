import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

import { AddCategoryCard, CategoryCard } from "@/components/CategoryCard";
import { useSavedItems } from "@/contexts/SavedItemsContext";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

const CATEGORY_COLORS = [
  "#D946EF", "#8B5CF6", "#22D3EE", "#F472B6",
  "#34D399", "#FBBF24", "#60A5FA", "#F87171",
  "#F97316", "#EC4899", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#6366F1", "#3B82F6",
];

const CATEGORY_ICONS = [
  "folder", "heart", "star", "film",
  "coffee", "globe", "zap", "activity",
  "book-open", "check-circle", "music", "cpu",
  "camera", "award", "flag", "map-pin",
  "shopping-bag", "sun", "briefcase", "home",
  "mic", "headphones", "monitor", "tool",
  "archive", "bell", "bookmark", "feather",
];

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, items, addCategory, updateCategory, deleteCategory } = useSavedItems();

  const [formMode, setFormMode] = useState<"none" | "add" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const listRef = useRef<FlatList<number> | null>(null);
  const formInputRef = useRef<TextInput | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = normalizeCategoryName(item.category);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [items]);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categorySearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedQuery)
    );
  }, [categories, categorySearchQuery]);

  const scrollToFormAndFocus = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      setTimeout(() => {
        formInputRef.current?.focus();
      }, 220);
    });
  }, []);

  function openAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormName("");
    setSelectedColor(0);
    setSelectedIcon(0);
    setEditingId(null);
    setFormMode("add");
    scrollToFormAndFocus();
  }

  function openEdit(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const colorIdx = CATEGORY_COLORS.indexOf(cat.color);
    const iconIdx = CATEGORY_ICONS.indexOf(cat.icon);
    setFormName(cat.name);
    setSelectedColor(colorIdx >= 0 ? colorIdx : 0);
    setSelectedIcon(iconIdx >= 0 ? iconIdx : 0);
    setEditingId(id);
    setFormMode("edit");
    scrollToFormAndFocus();
  }

  function closeForm() {
    setFormMode("none");
    setEditingId(null);
    setFormName("");
  }

  function handleAdd() {
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    const exists = categories.some(
      (cat) => normalizeCategoryName(cat.name) === normalizeCategoryName(trimmedName)
    );
    if (exists) {
      Alert.alert("Category already exists");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategory({
      name: trimmedName,
      color: CATEGORY_COLORS[selectedColor],
      icon: CATEGORY_ICONS[selectedIcon],
    });
    closeForm();
  }

  function handleSaveEdit() {
    const trimmedName = formName.trim();
    if (!trimmedName || !editingId) return;

    const exists = categories.some(
      (cat) =>
        cat.id !== editingId &&
        normalizeCategoryName(cat.name) === normalizeCategoryName(trimmedName)
    );
    if (exists) {
      Alert.alert("Category already exists");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCategory(editingId, {
      name: trimmedName,
      color: CATEGORY_COLORS[selectedColor],
      icon: CATEGORY_ICONS[selectedIcon],
    });
    closeForm();
  }

  function handleDelete(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const count = categoryItemCounts[normalizeCategoryName(cat.name)] || 0;
    Alert.alert(
      "Delete Category",
      count > 0
        ? `"${cat.name}" has ${count} saved item${count !== 1 ? "s" : ""}. Deleting it will unlink those items — they won't be deleted. Continue?`
        : `Delete "${cat.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCategory(id);
            if (editingId === id) closeForm();
          },
        },
      ]
    );
  }

  const totalVideos = items.length;
  const isEditing = formMode === "edit";
  const showForm = formMode !== "none";

  return (
    <View style={styles.container}>
      <View style={styles.glowBottom} pointerEvents="none" />

      <FlatList
        ref={listRef}
        data={[1]}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 14, paddingBottom: bottomPadding }]}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={styles.headerWrap}>
              <Text style={styles.subtitle}>Browse &amp; manage</Text>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Collections</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Feather name="layers" size={11} color="#A5F3FC" />
                    <Text style={styles.statText}>{categories.length}</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Feather name="bookmark" size={11} color="#A5F3FC" />
                    <Text style={styles.statText}>{totalVideos}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Add / Edit form ── */}
            {showForm && (
              <View style={styles.addForm}>
                <View style={styles.addFormHeader}>
                  <LinearGradient
                    colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addFormIconWrap}
                  >
                    <Feather name={isEditing ? "edit-2" : "folder-plus"} size={15} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.addFormTitle}>
                    {isEditing ? "Edit Collection" : "New Collection"}
                  </Text>
                  <Pressable onPress={closeForm} hitSlop={8}>
                    <Feather name="x" size={18} color="rgba(255,255,255,0.35)" />
                  </Pressable>
                </View>

                <TextInput
                  ref={formInputRef}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Collection name..."
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={styles.formInput}
                  autoFocus
                />

                <Text style={styles.formLabel}>COLOR</Text>
                <View style={styles.swatchRow}>
                  {CATEGORY_COLORS.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(i)}
                      style={[styles.colorSwatch, { backgroundColor: c }, selectedColor === i && styles.swatchSelected]}
                    >
                      {selectedColor === i && <Feather name="check" size={11} color="#fff" />}
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.formLabel}>ICON</Text>
                <View style={styles.swatchRow}>
                  {CATEGORY_ICONS.map((icon, i) => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(i)}
                      style={[
                        styles.iconSwatch,
                        selectedIcon === i && {
                          backgroundColor: CATEGORY_COLORS[selectedColor] + "20",
                          borderColor: CATEGORY_COLORS[selectedColor] + "60",
                        },
                      ]}
                    >
                      <Feather
                        name={icon as any}
                        size={16}
                        color={selectedIcon === i ? CATEGORY_COLORS[selectedColor] : "rgba(255,255,255,0.35)"}
                      />
                    </Pressable>
                  ))}
                </View>

                <View style={styles.formActions}>
                  {isEditing && (
                    <Pressable
                      onPress={() => handleDelete(editingId!)}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={isEditing ? handleSaveEdit : handleAdd}
                    style={[styles.createBtnWrap, { flex: 1 }]}
                    disabled={!formName.trim()}
                  >
                    <LinearGradient
                      colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.createBtn, { opacity: formName.trim() ? 1 : 0.45 }]}
                    >
                      <Feather name={isEditing ? "check" : "plus"} size={15} color="#fff" />
                      <Text style={styles.createBtnText}>
                        {isEditing ? "Save Changes" : "Create Collection"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.searchWrap}>
              <TextInput
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
                placeholder="Search categories"
                placeholderTextColor="rgba(255,255,255,0.30)"
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.sectionLabel}>ALL COLLECTIONS</Text>
          </View>
        }
        renderItem={() => (
          <View style={styles.grid}>
            {filteredCategories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                itemCount={
                  categoryItemCounts[normalizeCategoryName(category.name)] || 0
                }
                onPress={() => router.push(`/category/${category.id}`)}
                onEdit={() => openEdit(category.id)}
                index={i}
              />
            ))}
            {!categorySearchQuery.trim() && <AddCategoryCard onPress={openAdd} />}
            {categorySearchQuery.trim().length > 0 && filteredCategories.length === 0 && (
              <Text style={styles.searchEmptyText}>No categories found</Text>
            )}
            {(filteredCategories.length + (categorySearchQuery.trim() ? 0 : 1)) % 2 !== 0 && (
              <View style={styles.gridPad} />
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  glowBottom: {
    position: "absolute",
    bottom: 60,
    left: "33%",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(139,92,246,0.07)",
  },
  content: { paddingHorizontal: 15 },

  headerWrap: { paddingHorizontal: 5, marginBottom: 24 },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.6,
    color: "#FFFFFF",
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  statText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.55)",
  },

  addForm: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 20,
    gap: 12,
  },
  addFormHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  addFormIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addFormTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  formInput: {
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  formLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, color: "rgba(255,255,255,0.30)" },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  swatchSelected: { borderWidth: 2, borderColor: "#fff" },
  iconSwatch: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
  },
  formActions: { flexDirection: "row", gap: 10 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.30)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  deleteBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#EF4444" },
  createBtnWrap: { borderRadius: 16, overflow: "hidden" },
  createBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  createBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  sectionLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2,
    color: "rgba(255,255,255,0.20)", marginBottom: 10, paddingHorizontal: 5,
  },
  searchWrap: {
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  searchEmptyText: {
    width: "100%",
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingVertical: 18,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  gridPad: { width: "50%", padding: 5 },
});
