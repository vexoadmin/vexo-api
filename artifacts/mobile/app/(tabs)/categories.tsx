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

const CATEGORY_COLORS = ["#784BEA", "#6466EF", "#A56BF7", "#FA7DBA", "#2C6FD8", "#10B981", "#F59E0B", "#EF4444"];
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
            <View style={styles.headerGlow}>
              <LinearGradient
                colors={["#784BEA14", "#6466EF08", "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.headerRow}>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.titleMain}>Collections</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                    {categories.length} {categories.length === 1 ? "category" : "categories"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAdd(!showAdd);
                  }}
                  style={[
                    styles.addBtn,
                    showAdd
                      ? { backgroundColor: "#784BEA25", borderColor: "#784BEA55" }
                      : { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name={showAdd ? "x" : "plus"} size={19} color={showAdd ? "#A56BF7" : colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            {showAdd && (
              <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: "#784BEA28" }]}>
                <LinearGradient
                  colors={["#784BEA10", "transparent"]}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Collection name..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
                  autoFocus
                />
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>COLOR</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_COLORS.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(i)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        selectedColor === i && { borderWidth: 2.5, borderColor: "#fff" },
                      ]}
                    >
                      {selectedColor === i && (
                        <Feather name="check" size={11} color="#fff" />
                      )}
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>ICON</Text>
                <View style={styles.optionsRow}>
                  {CATEGORY_ICONS.map((icon, i) => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(i)}
                      style={[
                        styles.iconSwatch,
                        {
                          backgroundColor: selectedIcon === i ? CATEGORY_COLORS[selectedColor] + "22" : colors.secondary,
                          borderColor: selectedIcon === i ? CATEGORY_COLORS[selectedColor] + "70" : colors.border,
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
                <Pressable onPress={handleAdd} style={{ borderRadius: 14, overflow: "hidden", marginTop: 4 }}>
                  <LinearGradient
                    colors={["#6466EF", "#784BEA", "#A56BF7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                  >
                    <Feather name="plus" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>Create Collection</Text>
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
            <LinearGradient
              colors={["#784BEA20", "#6466EF10"]}
              style={styles.emptyIconRing}
            >
              <Feather name="folder" size={36} color="#A56BF7" style={{ opacity: 0.8 }} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No collections yet</Text>
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
  content: { paddingHorizontal: 16 },
  headerGlow: {
    overflow: "hidden",
    marginBottom: 20,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  titleMain: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    color: "#F0F1FF",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addForm: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    gap: 10,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderRadius: 12,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSwatch: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  saveBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIconRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
