import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface SavedItem {
  id: string;
  url: string;
  title: string;
  platform: "tiktok" | "instagram" | "youtube";
  category: string;
  notes: string;
  thumbnailColor: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface SavedItemsContextType {
  items: SavedItem[];
  categories: Category[];
  addItem: (item: Omit<SavedItem, "id" | "createdAt">) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<SavedItem>) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  searchItems: (query: string) => SavedItem[];
}

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);

const ITEMS_KEY = "@vexo_items";
const CATEGORIES_KEY = "@vexo_categories";

const GRADIENT_COLORS = [
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#4F46E5",
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Tutorials", color: "#8B5CF6", icon: "book-open" },
  { id: "2", name: "Music", color: "#3B82F6", icon: "music" },
  { id: "3", name: "Cooking", color: "#06B6D4", icon: "coffee" },
  { id: "4", name: "Fitness", color: "#7C3AED", icon: "activity" },
  { id: "5", name: "Comedy", color: "#6366F1", icon: "smile" },
  { id: "6", name: "Tech", color: "#2563EB", icon: "cpu" },
];

const SAMPLE_ITEMS: SavedItem[] = [
  {
    id: "s1",
    url: "https://youtube.com/watch?v=abc123",
    title: "Learn React Native in 2024",
    platform: "youtube",
    category: "Tutorials",
    notes: "Great beginner tutorial",
    thumbnailColor: "#8B5CF6",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "s2",
    url: "https://tiktok.com/@user/video/123",
    title: "Quick pasta recipe",
    platform: "tiktok",
    category: "Cooking",
    notes: "Try this weekend",
    thumbnailColor: "#06B6D4",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "s3",
    url: "https://instagram.com/reel/xyz",
    title: "Morning workout routine",
    platform: "instagram",
    category: "Fitness",
    notes: "15 min routine, no equipment needed",
    thumbnailColor: "#7C3AED",
    createdAt: Date.now() - 259200000,
  },
  {
    id: "s4",
    url: "https://youtube.com/watch?v=def456",
    title: "Lo-fi beats to study to",
    platform: "youtube",
    category: "Music",
    notes: "",
    thumbnailColor: "#3B82F6",
    createdAt: Date.now() - 345600000,
  },
  {
    id: "s5",
    url: "https://tiktok.com/@comedian/video/789",
    title: "Hilarious cat compilation",
    platform: "tiktok",
    category: "Comedy",
    notes: "So funny, watch again",
    thumbnailColor: "#6366F1",
    createdAt: Date.now() - 432000000,
  },
  {
    id: "s6",
    url: "https://youtube.com/watch?v=ghi789",
    title: "iPhone 16 Pro Review",
    platform: "youtube",
    category: "Tech",
    notes: "Camera improvements are great",
    thumbnailColor: "#2563EB",
    createdAt: Date.now() - 518400000,
  },
  {
    id: "s7",
    url: "https://instagram.com/reel/abc",
    title: "Homemade pizza tips",
    platform: "instagram",
    category: "Cooking",
    notes: "Neapolitan style dough recipe",
    thumbnailColor: "#0891B2",
    createdAt: Date.now() - 604800000,
  },
  {
    id: "s8",
    url: "https://tiktok.com/@techguy/video/456",
    title: "Top 5 VS Code Extensions",
    platform: "tiktok",
    category: "Tech",
    notes: "Must have extensions",
    thumbnailColor: "#4F46E5",
    createdAt: Date.now() - 691200000,
  },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, loaded]);

  async function loadData() {
    try {
      const [storedItems, storedCategories] = await Promise.all([
        AsyncStorage.getItem(ITEMS_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        setItems(SAMPLE_ITEMS);
      }
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch {
      setItems(SAMPLE_ITEMS);
    }
    setLoaded(true);
  }

  const addItem = useCallback((item: Omit<SavedItem, "id" | "createdAt">) => {
    const newItem: SavedItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<SavedItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const addCategory = useCallback((category: Omit<Category, "id">) => {
    const newCategory: Category = { ...category, id: generateId() };
    setCategories((prev) => [...prev, newCategory]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const searchItems = useCallback(
    (query: string) => {
      const lower = query.toLowerCase();
      return items.filter(
        (i) =>
          i.title.toLowerCase().includes(lower) ||
          i.notes.toLowerCase().includes(lower) ||
          i.category.toLowerCase().includes(lower) ||
          i.platform.toLowerCase().includes(lower)
      );
    },
    [items]
  );

  return (
    <SavedItemsContext.Provider
      value={{ items, categories, addItem, deleteItem, updateItem, addCategory, deleteCategory, searchItems }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
}
