import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  extractYoutubeId,
  fetchVideoMetadata,
  getYoutubeThumbnail,
} from "../utils/videoMetadata";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

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

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function dedupeCategories(input: Category[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];

  for (const category of input) {
    const normalized = normalizeCategoryName(category.name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({ ...category, name: category.name.trim() });
  }

  return out;
}

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
    url: "https://www.youtube.com/watch?v=3AKt1R1aDnU",
    title: "5-minute Pasta Carbonara recipe",
    platform: "youtube",
    category: "Recipes",
    notes: "Use pancetta not bacon",
    thumbnailColor: "#F97316",
    thumbnailUrl: "https://img.youtube.com/vi/3AKt1R1aDnU/hqdefault.jpg",
    createdAt: Date.now() - 86400000,
    reminder: tomorrow,
  },
  {
    id: "s2",
    url: "https://www.tiktok.com/@visitbali/video/7301234567890123456",
    title: "Best Bali travel spots 2024",
    platform: "tiktok",
    category: "Travel",
    notes: "Book rice terraces sunrise tour",
    thumbnailColor: "#06B6D4",
    thumbnailUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=640&q=80",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "s3",
    url: "https://www.instagram.com/reel/C1234567890/",
    title: "Morning yoga for kids — 10 mins",
    platform: "instagram",
    category: "Kids",
    notes: "Perfect for school mornings",
    thumbnailColor: "#EC4899",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&q=80",
    createdAt: Date.now() - 259200000,
    reminder: nextWeek,
  },
  {
    id: "s4",
    url: "https://www.youtube.com/watch?v=MkNeIUgNPQ8",
    title: "How to learn anything 10x faster",
    platform: "youtube",
    category: "Learning",
    notes: "The Feynman technique section is gold",
    thumbnailColor: "#8B5CF6",
    thumbnailUrl: "https://img.youtube.com/vi/MkNeIUgNPQ8/hqdefault.jpg",
    createdAt: Date.now() - 345600000,
  },
  {
    id: "s5",
    url: "https://www.tiktok.com/@motivation/video/7312345678901234567",
    title: "Daily habits of highly creative people",
    platform: "tiktok",
    category: "Inspiration",
    notes: "Start a morning pages journal",
    thumbnailColor: "#F59E0B",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80",
    createdAt: Date.now() - 432000000,
  },
  {
    id: "s6",
    url: "https://www.youtube.com/watch?v=fKdDPIFkOoQ",
    title: "iPhone photography tips that actually work",
    platform: "youtube",
    category: "Tips",
    notes: "Grid lines + rule of thirds",
    thumbnailColor: "#10B981",
    thumbnailUrl: "https://img.youtube.com/vi/fKdDPIFkOoQ/hqdefault.jpg",
    createdAt: Date.now() - 518400000,
  },
  {
    id: "s7",
    url: "https://www.instagram.com/reel/C7654321098/",
    title: "Lo-fi beats playlist — 3 hours",
    platform: "instagram",
    category: "Music",
    notes: "Good for focus sessions",
    thumbnailColor: "#3B82F6",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80",
    createdAt: Date.now() - 604800000,
  },
  {
    id: "s8",
    url: "https://www.tiktok.com/@codewithme/video/7323456789012345678",
    title: "10 VS Code tricks you didn't know",
    platform: "tiktok",
    category: "Tech",
    notes: "Multi-cursor selection blew my mind",
    thumbnailColor: "#6366F1",
    thumbnailUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=640&q=80",
    createdAt: Date.now() - 691200000,
  },
  {
    id: "s9",
    url: "https://www.youtube.com/watch?v=CBpFpsksEto",
    title: "30-day fitness challenge — Week 1",
    platform: "youtube",
    category: "Fitness",
    notes: "No equipment needed",
    thumbnailColor: "#EF4444",
    thumbnailUrl: "https://img.youtube.com/vi/CBpFpsksEto/hqdefault.jpg",
    createdAt: Date.now() - 777600000,
  },
  {
    id: "s10",
    url: "https://www.instagram.com/reel/C9876543210/",
    title: "Sourdough bread recipe — beginner friendly",
    platform: "instagram",
    category: "Recipes",
    notes: "72 hour cold ferment version",
    thumbnailColor: "#F97316",
    thumbnailUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=640&q=80",
    createdAt: Date.now() - 864000000,
  },
];

/**
 * For users who already have the old sample items stored in AsyncStorage
 * (no thumbnailUrl), patch them with the correct URLs without wiping their data.
 */
const SAMPLE_THUMBNAIL_MAP: Record<string, string> = {
  s1: "https://img.youtube.com/vi/3AKt1R1aDnU/hqdefault.jpg",
  s2: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=640&q=80",
  s3: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&q=80",
  s4: "https://img.youtube.com/vi/MkNeIUgNPQ8/hqdefault.jpg",
  s5: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80",
  s6: "https://img.youtube.com/vi/fKdDPIFkOoQ/hqdefault.jpg",
  s7: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80",
  s8: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=640&q=80",
  s9: "https://img.youtube.com/vi/CBpFpsksEto/hqdefault.jpg",
  s10: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=640&q=80",
};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const { mode, profile, isHydrated: authHydrated } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);
  const isRemoteMode = mode === "authenticated" && !!profile?.id;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loaded && !isRemoteMode) {
      AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    }
  }, [items, loaded, isRemoteMode]);

  useEffect(() => {
    if (loaded && !isRemoteMode) {
      AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, loaded, isRemoteMode]);

  async function loadLocalData() {
    try {
      const [storedItems, storedCategories] = await Promise.all([
        AsyncStorage.getItem(ITEMS_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      const loadedItems: SavedItem[] = storedItems ? JSON.parse(storedItems) : SAMPLE_ITEMS;
      const parsedCategories: Category[] = storedCategories
        ? JSON.parse(storedCategories)
        : DEFAULT_CATEGORIES;
      const normalizedCategories = dedupeCategories(parsedCategories);
      setItems(loadedItems);
      setCategories(normalizedCategories);
      /* Repair missing thumbnails in the background — never blocks the UI */
      repairMissingThumbnails(loadedItems);
    } catch {
      setItems(SAMPLE_ITEMS);
      setCategories(DEFAULT_CATEGORIES);
      repairMissingThumbnails(SAMPLE_ITEMS);
    }
    if (mountedRef.current) setLoaded(true);
  }

  function mapCategoryStyle(name: string) {
    const normalized = normalizeCategoryName(name);
    const existing =
      DEFAULT_CATEGORIES.find(
        (c) => normalizeCategoryName(c.name) === normalized
      ) || DEFAULT_CATEGORIES[Math.abs(normalized.length) % DEFAULT_CATEGORIES.length];
    return { color: existing.color, icon: existing.icon };
  }

  async function loadRemoteData(userId: string) {
    try {
      const [catRes, itemRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("saved_items")
          .select(
            "id,url,title,thumbnail_url,reminder_date,created_at,category_id,categories(name)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (catRes.error || itemRes.error) {
        throw new Error(catRes.error?.message || itemRes.error?.message);
      }

      const remoteCategories: Category[] = (catRes.data || []).map((cat) => {
        const style = mapCategoryStyle(cat.name);
        return {
          id: cat.id,
          name: cat.name,
          color: style.color,
          icon: style.icon,
        };
      });

      const categoryNameById = new Map(remoteCategories.map((c) => [c.id, c.name]));

      const remoteItems: SavedItem[] = (itemRes.data || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        title: item.title || item.url || "Saved link",
        platform: "website",
        category:
          item.categories?.name ||
          categoryNameById.get(item.category_id) ||
          "Uncategorized",
        notes: "",
        thumbnailColor: "#8B5CF6",
        thumbnailUrl: item.thumbnail_url || undefined,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        reminder: item.reminder_date
          ? new Date(item.reminder_date).getTime()
          : undefined,
      }));

      if (mountedRef.current) {
        console.log("SavedItems loadRemoteData mapped items:", remoteItems.slice(0, 5));
        setCategories(
          remoteCategories.length > 0 ? remoteCategories : DEFAULT_CATEGORIES,
        );
        setItems(remoteItems);
        setLoaded(true);
      }
    } catch {
      // Fallback to local if Supabase fails, to keep beta stable.
      await loadLocalData();
    }
  }

  useEffect(() => {
    if (!authHydrated) return;
    setLoaded(false);
    if (isRemoteMode && profile?.id) {
      void loadRemoteData(profile.id);
    } else {
      void loadLocalData();
    }
  }, [authHydrated, isRemoteMode, profile?.id]);

  function categoryIdByName(name: string): string | undefined {
    const normalized = normalizeCategoryName(name);
    return categories.find((c) => normalizeCategoryName(c.name) === normalized)?.id;
  }

  async function upsertRemoteCategory(userId: string, name: string): Promise<string | null> {
    const existing = categories.find(
      (c) => normalizeCategoryName(c.name) === normalizeCategoryName(name),
    );
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, name })
      .select("id")
      .single();
    if (error || !data) return null;

    const style = mapCategoryStyle(name);
    setCategories((prev) => [...prev, { id: data.id, name, ...style }]);
    return data.id;
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

    const fixes: Record<string, string> = {};

    /* ── Pass 1a: known sample items — guaranteed thumbnails, no network ── */
    for (const item of missing) {
      if (SAMPLE_THUMBNAIL_MAP[item.id]) {
        fixes[item.id] = SAMPLE_THUMBNAIL_MAP[item.id];
      }
    }

    /* ── Pass 1b: YouTube — derive from video ID, no network ── */
    for (const item of missing) {
      if (!fixes[item.id] && item.platform === "youtube") {
        const videoId = extractYoutubeId(item.url);
        if (videoId) fixes[item.id] = getYoutubeThumbnail(videoId);
      }
    }

    if (Object.keys(fixes).length > 0 && mountedRef.current) {
      setItems((prev) =>
        prev.map((item) =>
          fixes[item.id] ? { ...item, thumbnailUrl: fixes[item.id] } : item
        )
      );
    }

    /* ── Pass 2: other platforms — network fetch, max 5, sequential ── */
    const networkItems = missing
      .filter((item) => !fixes[item.id])
      .slice(0, 5);

    for (const item of networkItems) {
      if (!mountedRef.current) break;
      try {
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
        /* silently ignored — VideoCard has a styled fallback */
      }
    }
  }

  const addItem = useCallback(
    (item: Omit<SavedItem, "id" | "createdAt">) => {
      console.log("SavedItems addItem received payload:", item);
      console.log("SavedItems addItem mode:", isRemoteMode ? "supabase" : "local");
      const optimisticId = generateId();
      const optimisticItem = { ...item, id: optimisticId, createdAt: Date.now() };
      setItems((prev) => [optimisticItem, ...prev]);

      if (isRemoteMode && profile?.id) {
        void (async () => {
          const categoryId = (await upsertRemoteCategory(profile.id, item.category)) ||
            categoryIdByName(item.category);
          const insertPayload = {
            user_id: profile.id,
            url: item.url,
            title: item.title,
            thumbnail_url: item.thumbnailUrl ?? null,
            category_id: categoryId ?? null,
            reminder_date: item.reminder ? new Date(item.reminder).toISOString() : null,
          };
          console.log("SavedItems Supabase insert payload:", insertPayload);
          const { data, error } = await supabase
            .from("saved_items")
            .insert(insertPayload)
            .select("id,created_at,title,thumbnail_url,url")
            .single();
          console.log("SavedItems Supabase insert result:", { data, error });

          if (data && mountedRef.current && !error) {
            setItems((prev) =>
              prev.map((saved) =>
                saved.id === optimisticId
                  ? {
                      ...saved,
                      id: data.id,
                      url: data.url ?? saved.url,
                      title: data.title ?? saved.title,
                      thumbnailUrl: data.thumbnail_url ?? saved.thumbnailUrl,
                      createdAt: new Date(data.created_at).getTime(),
                    }
                  : saved,
              ),
            );
          }
        })();
      } else {
        console.log("SavedItems local save result:", optimisticItem);
      }
    },
    [isRemoteMode, profile?.id, categories],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (isRemoteMode) {
        void supabase.from("saved_items").delete().eq("id", id);
      }
    },
    [isRemoteMode],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<SavedItem>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      if (isRemoteMode && profile?.id) {
        void (async () => {
          const payload: Record<string, unknown> = {};
          if (typeof updates.url === "string") payload["url"] = updates.url;
          if (typeof updates.title === "string") payload["title"] = updates.title;
          if (typeof updates.thumbnailUrl === "string" || updates.thumbnailUrl === undefined) {
            payload["thumbnail_url"] = updates.thumbnailUrl ?? null;
          }
          if (typeof updates.reminder === "number" || updates.reminder === undefined) {
            payload["reminder_date"] = updates.reminder
              ? new Date(updates.reminder).toISOString()
              : null;
          }
          if (typeof updates.category === "string") {
            const categoryId =
              (await upsertRemoteCategory(profile.id, updates.category)) ||
              categoryIdByName(updates.category);
            payload["category_id"] = categoryId ?? null;
          }
          if (Object.keys(payload).length > 0) {
            await supabase.from("saved_items").update(payload).eq("id", id);
          }
        })();
      }
    },
    [isRemoteMode, profile?.id, categories],
  );

  const addCategory = useCallback(
    (category: Omit<Category, "id">) => {
      const trimmedName = category.name.trim();
      const normalizedName = normalizeCategoryName(trimmedName);
      if (!normalizedName) return;

      const newLocalId = generateId();
      setCategories((prev) => {
        const exists = prev.some(
          (cat) => normalizeCategoryName(cat.name) === normalizedName,
        );
        if (exists) return prev;
        return [...prev, { ...category, name: trimmedName, id: newLocalId }];
      });

      if (isRemoteMode && profile?.id) {
        void (async () => {
          const { data } = await supabase
            .from("categories")
            .insert({ user_id: profile.id, name: trimmedName })
            .select("id")
            .single();
          if (data && mountedRef.current) {
            setCategories((prev) =>
              prev.map((cat) => (cat.id === newLocalId ? { ...cat, id: data.id } : cat)),
            );
          }
        })();
      }
    },
    [isRemoteMode, profile?.id],
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, "id">>) => {
      setCategories((prev) => {
        const oldCat = prev.find((c) => c.id === id);
        if (!oldCat) return prev;

        const trimmedName = updates.name?.trim();
        const hasNewName =
          typeof trimmedName === "string" && trimmedName.length > 0;
        const normalizedTarget = hasNewName
          ? normalizeCategoryName(trimmedName)
          : null;

        if (normalizedTarget) {
          const duplicate = prev.some(
            (cat) =>
              cat.id !== id &&
              normalizeCategoryName(cat.name) === normalizedTarget
          );
          if (duplicate) return prev;
        }

        if (
          normalizedTarget &&
          normalizeCategoryName(oldCat.name) !== normalizedTarget
        ) {
          const oldName = oldCat.name;
          const newName = trimmedName as string;
          setItems((items) =>
            items.map((item) =>
              item.category === oldName ? { ...item, category: newName } : item
            )
          );
          if (isRemoteMode) {
            void supabase.from("categories").update({ name: newName }).eq("id", id);
          }
        }

        return prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updates,
                ...(hasNewName ? { name: trimmedName } : null),
              }
            : c
        );
      });
    },
    [isRemoteMode]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (isRemoteMode) {
        void supabase.from("categories").delete().eq("id", id);
      }
    },
    [isRemoteMode],
  );

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
