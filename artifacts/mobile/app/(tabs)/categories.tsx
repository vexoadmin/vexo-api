import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
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

import { AddCategoryCard, CategoryCard } from "@/components/CategoryCard";
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

  function openAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAdd(true);
  }

  const totalVideos = items.length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 14, paddingBottom: bottomPadding },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={["#7C5CFF10", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={styles.welcomeText}>Browse &amp; manage</Text>
          <Text style={styles.title}>Collections</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Feather name="layers" size={11} color="#7C5CFF" />
              <Text style={styles.statText}>{categories.length} collections</Text>
            </View>
            <View style={styles.statChip}>
              <Feather name="bookmark" size={11} color="#4CC9F0" />
              <Text style={styles.statText}>{totalVideos} videos</Text>
            </View>
          </View>
        </View>

        {/* ── Add form (expandable) ── */}
        {showAdd && (
          <View style={styles.addForm}>
            <View style={styles.addFormHeader}>
              <LinearGradient
                colors={["#7C5CFF", "#4CC9F0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addFormIconWrap}
              >
                <Feather name="folder-plus" size={16} color="#fff" />
              </LinearGradient>
              <Text style={styles.addFormTitle}>New Collection</Text>
              <Pressable
                onPress={() => { setShowAdd(false); setNewName(""); }}
                hitSlop={8}
              >
                <Feather name="x" size={18} color="#4A5170" />
              </Pressable>
            </View>

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
              style={{ borderRadius: 16, overflow: "hidden" }}
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

        {/* ── Section label ── */}
        <Text style={styles.sectionLabel}>ALL COLLECTIONS</Text>

        {/* ── Grid ── */}
        <View style={styles.grid}>
          {categories.map((category, i) => (
            <CategoryCard
              key={category.id}
              category={category}
              itemCount={categoryItemCounts[category.name] || 0}
              onPress={() => router.push(`/category/${category.id}`)}
            />
          ))}
          <AddCategoryCard onPress={openAdd} />
          {/* Pad to even columns */}
          {(categories.length + 1) % 2 !== 0 && <View style={styles.gridPad} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 15,
    gap: 0,
  },

  headerWrap: {
    overflow: "hidden",
    marginBottom: 24,
    paddingHorizontal: 5,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#4A5170",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.6,
    color: "#FFFFFF",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
  },

  addForm: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 20,
    gap: 12,
  },
  addFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  addFormIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addFormTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  formInput: {
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
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
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconSwatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    marginBottom: 10,
    paddingHorizontal: 5,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  gridPad: {
    width: "50%",
    padding: 5,
  },
});
