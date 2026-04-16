import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  extractYoutubeId,
  fetchVideoMetadata,
  getYoutubeThumbnail,
} from "../utils/videoMetadata";

export interface SavedItem {
  id: string;
  url: string;
  title: string;
  platform: "tiktok" | "instagram" | "youtube" | "facebook" | "website" | "pinterest";
  category: string;
  notes: string;
  thumbnailColor: string;
  thumbnailUrl?: string;
  createdAt: number;
  reminder?: number;
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
  updateCategory: (id: string, updates: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
  searchItems: (query: string) => SavedItem[];
}

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);

const ITEMS_KEY = "@vexo_items_v2";
const CATEGORIES_KEY = "@vexo_categories_v2";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Recipes", color: "#F97316", icon: "coffee" },
  { id: "2", name: "Kids", color: "#EC4899", icon: "star" },
  { id: "3", name: "Travel", color: "#06B6D4", icon: "globe" },
  { id: "4", name: "Learning", color: "#8B5CF6", icon: "book-open" },
  { id: "5", name: "Inspiration", color: "#F59E0B", icon: "zap" },
  { id: "6", name: "Tips", color: "#10B981", icon: "check-circle" },
  { id: "7", name: "Music", color: "#3B82F6", icon: "music" },
  { id: "8", name: "Fitness", color: "#EF4444", icon: "activity" },
  { id: "9", name: "Tech", color: "#6366F1", icon: "cpu" },
];

const tomorrow = Date.now() + 86400000;
const nextWeek = Date.now() + 604800000;

const SAMPLE_ITEMS: SavedItem[] = [
  {
    id: "s1",
    url: "https://youtube.com/watch?v=abc123",
    title: "5-minute Pasta Carbonara recipe",
    platform: "youtube",
    category: "Recipes",
    notes: "Use pancetta not bacon",
    thumbnailColor: "#F97316",
    createdAt: Date.now() - 86400000,
    reminder: tomorrow,
  },
  {
    id: "s2",
    url: "https://tiktok.com/@user/video/123",
    title: "Best Bali travel spots 2024",
    platform: "tiktok",
    category: "Travel",
    notes: "Book rice terraces sunrise tour",
    thumbnailColor: "#06B6D4",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "s3",
    url: "https://instagram.com/reel/xyz",
    title: "Morning yoga for kids — 10 mins",
    platform: "instagram",
    category: "Kids",
    notes: "Perfect for school mornings",
    thumbnailColor: "#EC4899",
    createdAt: Date.now() - 259200000,
    reminder: nextWeek,
  },
  {
    id: "s4",
    url: "https://youtube.com/watch?v=def456",
    title: "How to learn anything 10x faster",
    platform: "youtube",
    category: "Learning",
    notes: "The Feynman technique section is gold",
    thumbnailColor: "#8B5CF6",
    createdAt: Date.now() - 345600000,
  },
  {
    id: "s5",
    url: "https://tiktok.com/@inspire/video/789",
    title: "Daily habits of highly creative people",
    platform: "tiktok",
    category: "Inspiration",
    notes: "Start a morning pages journal",
    thumbnailColor: "#F59E0B",
    createdAt: Date.now() - 432000000,
  },
  {
    id: "s6",
    url: "https://youtube.com/watch?v=ghi789",
    title: "iPhone photography tips that actually work",
    platform: "youtube",
    category: "Tips",
    notes: "Grid lines + rule of thirds",
    thumbnailColor: "#10B981",
    createdAt: Date.now() - 518400000,
  },
  {
    id: "s7",
    url: "https://instagram.com/reel/abc",
    title: "Lo-fi beats playlist — 3 hours",
    platform: "instagram",
    category: "Music",
    notes: "Good for focus sessions",
    thumbnailColor: "#3B82F6",
    createdAt: Date.now() - 604800000,
  },
  {
    id: "s8",
    url: "https://tiktok.com/@techguy/video/456",
    title: "10 VS Code tricks you didn't know",
    platform: "tiktok",
    category: "Tech",
    notes: "Multi-cursor selection blew my mind",
    thumbnailColor: "#6366F1",
    createdAt: Date.now() - 691200000,
  },
  {
    id: "s9",
    url: "https://youtube.com/watch?v=jkl101",
    title: "30-day fitness challenge — Week 1",
    platform: "youtube",
    category: "Fitness",
    notes: "No equipment needed",
    thumbnailColor: "#EF4444",
    createdAt: Date.now() - 777600000,
  },
  {
    id: "s10",
    url: "https://instagram.com/reel/mnop",
    title: "Sourdough bread recipe — beginner friendly",
    platform: "instagram",
    category: "Recipes",
    notes: "72 hour cold ferment version",
    thumbnailColor: "#F97316",
    createdAt: Date.now() - 864000000,
  },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    loadData();
    return () => { mountedRef.current = false; };
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
      const loadedItems: SavedItem[] = storedItems ? JSON.parse(storedItems) : SAMPLE_ITEMS;
      setItems(loadedItems);
      setCategories(storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORIES);
      /* Repair missing thumbnails in the background — never blocks the UI */
      repairMissingThumbnails(loadedItems);
    } catch {
      setItems(SAMPLE_ITEMS);
      setCategories(DEFAULT_CATEGORIES);
      repairMissingThumbnails(SAMPLE_ITEMS);
    }
    setLoaded(true);
  }

  /**
   * Background repair: for each item missing a thumbnailUrl:
   *   - YouTube → compute instantly from video ID (no network)
   *   - Others  → try a single Microlink/noembed fetch, throttled
   * Updates are applied via setItems so they persist automatically.
   */
  async function repairMissingThumbnails(loadedItems: SavedItem[]) {
    const missing = loadedItems.filter((item) => !item.thumbnailUrl);
    if (missing.length === 0) return;

    /* ── Pass 1: YouTube — instant, no network ── */
    const ytFixes: Record<string, string> = {};
    for (const item of missing) {
      if (item.platform === "youtube") {
        const videoId = extractYoutubeId(item.url);
        if (videoId) ytFixes[item.id] = getYoutubeThumbnail(videoId);
      }
    }
    if (Object.keys(ytFixes).length > 0 && mountedRef.current) {
      setItems((prev) =>
        prev.map((item) =>
          ytFixes[item.id] ? { ...item, thumbnailUrl: ytFixes[item.id] } : item
        )
      );
    }

    /* ── Pass 2: other platforms — network, max 5, sequential ── */
    const networkItems = missing
      .filter((item) => item.platform !== "youtube" && !ytFixes[item.id])
      .slice(0, 5);

    for (const item of networkItems) {
      if (!mountedRef.current) break;
      try {
        /* Small delay so we don't hammer APIs on startup */
        await new Promise((r) => setTimeout(r, 800));
        if (!mountedRef.current) break;
        const meta = await fetchVideoMetadata(item.url, item.platform);
        if (meta.thumbnailUrl && mountedRef.current) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, thumbnailUrl: meta.thumbnailUrl } : p
            )
          );
        }
      } catch {
        /* silently ignore — fallback card UI handles no-thumbnail gracefully */
      }
    }
  }

  const addItem = useCallback((item: Omit<SavedItem, "id" | "createdAt">) => {
    setItems((prev) => [{ ...item, id: generateId(), createdAt: Date.now() }, ...prev]);
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<SavedItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const addCategory = useCallback((category: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...category, id: generateId() }]);
  }, []);

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, "id">>) => {
      setCategories((prev) => {
        const oldCat = prev.find((c) => c.id === id);
        if (oldCat && updates.name && updates.name !== oldCat.name) {
          const oldName = oldCat.name;
          const newName = updates.name;
          setItems((items) =>
            items.map((item) =>
              item.category === oldName ? { ...item, category: newName } : item
            )
          );
        }
        return prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      });
    },
    []
  );

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
      value={{ items, categories, addItem, deleteItem, updateItem, addCategory, updateCategory, deleteCategory, searchItems }}
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
