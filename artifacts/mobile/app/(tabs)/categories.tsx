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

const BG = "#0B0B12";
const SURFACE = "#11131F";
const BORDER = "#1A1B2E";

const CATEGORY_COLORS = [
  "#7C5CFF", "#4CC9F0", "#A78BFA", "#F472B6",
  "#34D399", "#FBBF24", "#60A5FA", "#F87171",
];
const CATEGORY_ICONS = [
  "folder", "heart", "star", "film",
  "coffee", "globe", "zap", "activity",
];

export default function CategoriesScreen() {
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
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 14, paddingBottom: bottomPadding },
        ]}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.headerWrap}>
              <LinearGradient
                colors={["#7C5CFF14", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>Collections</Text>
                  <Text style={styles.subtitle}>
                    {categories.length} {categories.length === 1 ? "collection" : "collections"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAdd(!showAdd);
                  }}
                  style={[styles.addBtn, showAdd && styles.addBtnActive]}
                >
                  <Feather
                    name={showAdd ? "x" : "plus"}
                    size={18}
                    color={showAdd ? "#7C5CFF" : "#9CA3AF"}
                  />
                </Pressable>
              </View>
            </View>

            {/* Add form */}
            {showAdd && (
              <View style={styles.addForm}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Collection name..."
                  placeholderTextColor="#4A5170"
                  style={styles.formInput}
                  autoFocus
                />

                <Text style={styles.formLabel}>COLOR</Text>
                <View style={styles.swatchRow}>
                  {CATEGORY_COLORS.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(i)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        selectedColor === i && styles.swatchSelected,
                      ]}
                    >
                      {selectedColor === i && (
                        <Feather name="check" size={11} color="#fff" />
                      )}
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
                        color={selectedIcon === i ? CATEGORY_COLORS[selectedColor] : "#4A5170"}
                      />
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={handleAdd}
                  style={{ borderRadius: 14, overflow: "hidden", marginTop: 4 }}
                >
                  <LinearGradient
                    colors={["#7C5CFF", "#4CC9F0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createBtn}
                  >
                    <Feather name="plus" size={15} color="#fff" />
                    <Text style={styles.createBtnText}>Create Collection</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            <Text style={styles.sectionLabel}>ALL COLLECTIONS</Text>
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
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="folder" size={32} color="#7C5CFF" style={{ opacity: 0.7 }} />
            </View>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptyDesc}>Tap + to create your first collection</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
  },

  headerWrap: {
    overflow: "hidden",
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.4,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2E3350",
    marginTop: 4,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnActive: {
    backgroundColor: "#7C5CFF18",
    borderColor: "#7C5CFF40",
  },

  addForm: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  formInput: {
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  formLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    color: "#4A5170",
    marginTop: 4,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconSwatch: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    color: "#2A2E45",
    marginBottom: 12,
  },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#7C5CFF14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
