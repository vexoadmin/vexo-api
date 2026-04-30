import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

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
  addItem: (
    item: Omit<SavedItem, "id" | "createdAt">
  ) => Promise<{ ok: boolean; reason?: string }>;
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
  console.log(
    "[CATEGORY DEBUG] dedupe input names/ids:",
    input.map((category) => ({ id: category.id, name: category.name })),
  );
  const seenIndexByName = new Map<string, number>();
  const out: Category[] = [];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const styleForCategory = (name: string) => {
    const normalized = normalizeCategoryName(name);
    const existing =
      DEFAULT_CATEGORIES.find(
        (category) => normalizeCategoryName(category.name) === normalized,
      ) || DEFAULT_CATEGORIES[Math.abs(normalized.length) % DEFAULT_CATEGORIES.length];
    return { color: existing.color, icon: existing.icon };
  };

  for (const category of input) {
    const normalized = normalizeCategoryName(category.name);
    if (!normalized) continue;
    const style = styleForCategory(category.name);
    const normalizedCategory: Category = {
      ...category,
      name: category.name.trim(),
      color: style.color,
      icon: style.icon,
    };
    const existingIndex = seenIndexByName.get(normalized);
    if (existingIndex === undefined) {
      seenIndexByName.set(normalized, out.length);
      out.push(normalizedCategory);
      continue;
    }

    const existingCategory = out[existingIndex];
    const existingIsUuid = uuidRegex.test(existingCategory.id);
    const nextIsUuid = uuidRegex.test(normalizedCategory.id);

    if (!existingIsUuid && nextIsUuid) {
      console.log("[CATEGORY DEBUG] dedupe removed duplicate category", {
        name: normalized,
        id: existingCategory.id,
      });
      out[existingIndex] = normalizedCategory;
      continue;
    }

    console.log("[CATEGORY DEBUG] dedupe removed duplicate category", {
      name: normalized,
      id: normalizedCategory.id,
    });
  }

  console.log(
    "[CATEGORY DEBUG] dedupe output names/ids:",
    out.map((category) => ({ id: category.id, name: category.name })),
  );
  if (out.length === input.length) {
    console.log("[CATEGORY DEBUG] duplicate names removed: none");
  }
  return out;
}

function findDuplicateCategoryNames(input: { name: string }[]): string[] {
  const counts = new Map<string, number>();
  for (const category of input) {
    const normalized = normalizeCategoryName(category.name);
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
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

const SAMPLE_ITEMS: SavedItem[] = [];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * For users who already have the old sample items stored in AsyncStorage
 * (no thumbnailUrl), patch them with the correct URLs without wiping their data.
 */
const SAMPLE_THUMBNAIL_MAP: Record<string, string> = {};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_REGEX.test(value);
}

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const { mode, user, profile, isHydrated: authHydrated } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);
  const authUserId = user?.id ?? null;
  const isRemoteMode = mode === "authenticated" && !!authUserId;

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
    console.log("[SAVED DEBUG] loadLocalData start");
    try {
      const [storedItems, storedCategories] = await Promise.all([
        AsyncStorage.getItem(ITEMS_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      const loadedItems: SavedItem[] = storedItems ? JSON.parse(storedItems) : [];
      const parsedCategories: Category[] = storedCategories
        ? JSON.parse(storedCategories)
        : DEFAULT_CATEGORIES;
      const normalizedCategories = dedupeCategories(parsedCategories);
      console.log("[SAVED DEBUG] loadLocalData parsed counts:", {
        loadedItems: loadedItems.length,
        loadedCategories: normalizedCategories.length,
      });
      console.log("[SAVED DEBUG] setting local items with count:", loadedItems.length);
      setItems(loadedItems);
      setCategories(normalizedCategories);
      /* Repair missing thumbnails in the background — never blocks the UI */
      repairMissingThumbnails(loadedItems);
      console.log("[SAVED DEBUG] loadLocalData end");
    } catch {
      console.log("[SAVED DEBUG] loadLocalData error");
      console.log("[SAVED DEBUG] setItems empty called from loadLocalData catch");
      setItems([]);
      setCategories(DEFAULT_CATEGORIES);
      repairMissingThumbnails([]);
      console.log("[SAVED DEBUG] loadLocalData end");
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
    console.log("[SAVED DEBUG] loadRemoteData start:", { userId });
    try {
      console.log("[LOAD] auth user id:", userId);
      console.log("[LOAD DEBUG] user_id used:", userId);
      const [catRes, itemRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("saved_items")
          .select(
            "id,user_id,url,title,thumbnail_url,reminder_date,created_at,category_id,categories(name)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      console.log(
        "[CATEGORY DEBUG] loadRemoteData raw catRes.data:",
        (catRes.data || []).map((cat) => ({
          id: cat.id,
          name: cat.name,
          created_at: cat.created_at,
        })),
      );
      console.log(
        "[CATEGORY DEBUG] loadRemoteData categories returned count:",
        catRes.data?.length ?? 0,
      );
      console.log("[SAVED DEBUG] loadRemoteData query results:", {
        userId,
        categoriesCount: catRes.data?.length ?? 0,
        savedItemsCount: itemRes.data?.length ?? 0,
        catResError: catRes.error ?? null,
        itemResError: itemRes.error ?? null,
      });

      console.log("[LOAD] saved_items query error:", itemRes.error);
      console.log("[LOAD ERROR] saved_items error:", itemRes.error);
      console.log("[LOAD] saved_items raw count:", itemRes.data?.length ?? 0);
      console.log("[LOAD] saved_items raw rows:", itemRes.data ?? []);

      if (itemRes.error) {
        throw new Error(itemRes.error.message);
      }
      if (catRes.error) {
        console.warn("SavedItems categories load failed:", catRes.error.message);
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
      console.log(
        "[CATEGORY DEBUG] remoteCategories names/ids:",
        remoteCategories.map((cat) => ({ id: cat.id, name: cat.name })),
      );
      const remoteDuplicateNames = findDuplicateCategoryNames(remoteCategories);
      if (remoteDuplicateNames.length > 0) {
        console.warn(
          "[categories] duplicate categories detected on remote load:",
          remoteDuplicateNames,
        );
      }
      const mergedCategories = dedupeCategories([
        ...DEFAULT_CATEGORIES,
        ...remoteCategories,
      ]);
      console.log(
        "[CATEGORY DEBUG] mergedCategories names/ids:",
        mergedCategories.map((cat) => ({ id: cat.id, name: cat.name })),
      );

      const categoryNameById = new Map(mergedCategories.map((c) => [c.id, c.name]));

      const remoteItems: SavedItem[] = (itemRes.data || [])
        .map((item: any) => ({
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
      console.log("[SAVED DEBUG] remoteItems length before setItems:", remoteItems.length);
      console.log("[LOAD] mapped items count:", remoteItems.length);
      console.log("[LOAD] final state items count before setItems:", remoteItems.length);

      if (mountedRef.current) {
        console.log("SavedItems loadRemoteData mapped items:", remoteItems.slice(0, 5));
        console.log("[SAVED DEBUG] setting remote items with count:", remoteItems.length);
        setCategories(mergedCategories);
        setItems(remoteItems);
        setLoaded(true);
      }
      console.log("[SAVED DEBUG] loadRemoteData end");
    } catch (error) {
      console.log("[LOAD] saved_items query error:", error);
      // In authenticated mode, never fall back to potentially stale local user data.
      if (mountedRef.current) {
        console.log("[SAVED DEBUG] setItems empty called from loadRemoteData catch");
        setItems([]);
        setCategories(DEFAULT_CATEGORIES);
        setLoaded(true);
      }
      console.log("[SAVED DEBUG] loadRemoteData end");
    }
  }

  useEffect(() => {
    console.log("[SAVED DEBUG] auth load effect run:", {
      authHydrated,
      isRemoteMode,
      authUserId,
      path:
        !authHydrated
          ? "return (not hydrated)"
          : isRemoteMode && authUserId
            ? "loadRemoteData"
            : "loadLocalData",
    });
    if (!authHydrated) return;
    setLoaded(false);
    if (authUserId) {
      console.log("[SAVED DEBUG] auth load effect path: loadRemoteData");
      void loadRemoteData(authUserId);
    } else {
      console.log("[SAVED DEBUG] skipping local load during auth");
      console.log("[SAVED DEBUG] unauthenticated mode: clearing local beta data");
      console.log("[SAVED DEBUG] setItems empty called from auth load effect unauthenticated branch");
      setItems([]);
      setCategories(DEFAULT_CATEGORIES);
      setLoaded(true);
    }
  }, [authHydrated, authUserId, isRemoteMode]);

  function categoryIdByName(name: string): string | undefined {
    const normalized = normalizeCategoryName(name);
    return categories.find((c) => normalizeCategoryName(c.name) === normalized)?.id;
  }

  async function upsertRemoteCategory(userId: string, name: string): Promise<string | null> {
    const trimmedName = name.trim();
    const normalizedName = normalizeCategoryName(trimmedName);
    if (!normalizedName) return null;

    const existing = categories.find(
      (c) => normalizeCategoryName(c.name) === normalizedName,
    );
    if (existing && isUuid(existing.id)) return existing.id;

    const existingRemote = await supabase
      .from("categories")
      .select("id,name")
      .eq("user_id", userId)
      .ilike("name", trimmedName);
    if (existingRemote.error) {
      return null;
    }
    const normalizedRemoteMatches = (existingRemote.data || []).filter(
      (cat) => normalizeCategoryName(cat.name) === normalizedName,
    );
    if (normalizedRemoteMatches.length > 1) {
      console.warn(
        "[categories] duplicate categories detected for user+name:",
        userId,
        normalizedName,
      );
    }
    const reusableRemote = normalizedRemoteMatches[0];
    if (reusableRemote?.id) {
      return reusableRemote.id;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, name: trimmedName })
      .select("id")
      .single();
    if (error || !data) return null;
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
    async (item: Omit<SavedItem, "id" | "createdAt">) => {
      console.log("SavedItems addItem received payload:", item);
      console.log("SavedItems addItem mode:", isRemoteMode ? "supabase" : "local");
      const optimisticId = generateId();
      const optimisticItem = { ...item, id: optimisticId, createdAt: Date.now() };
      setItems((prev) => [optimisticItem, ...prev]);

      if (isRemoteMode && authUserId) {
        try {
          if (!user?.id) {
            throw new Error("Authenticated user is missing. Cannot save item.");
          }
          const categoryId = (await upsertRemoteCategory(authUserId, item.category)) ||
            categoryIdByName(item.category);
          const normalizedCategoryId = isUuid(categoryId) ? categoryId : null;
          const insertPayload = {
            user_id: user.id,
            url: item.url,
            title: item.title,
            thumbnail_url: item.thumbnailUrl ?? null,
            category_id: normalizedCategoryId,
            reminder_date: item.reminder ? new Date(item.reminder).toISOString() : null,
          };
          console.log("[SAVE DEBUG] profile.id:", profile?.id);
          console.log("[SAVE DEBUG] auth user id:", user?.id);
          console.log("[SAVE] user_id being sent:", insertPayload.user_id);
          console.log("[SAVE FIXED] user_id:", user.id);
          console.log("SavedItems Supabase insert payload:", insertPayload);
          const { data, error } = await supabase
            .from("saved_items")
            .insert(insertPayload)
            .select(
              "id,user_id,url,title,thumbnail_url,category_id,reminder_date,created_at",
            )
            .single();
          console.log("SavedItems Supabase insert result:", { data, error });

          if (error || !data) {
            throw new Error(error?.message || "Save failed. No row was returned.");
          }

          if (mountedRef.current) {
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
          return { ok: true };
        } catch (err) {
          console.error("SavedItems Supabase insert failed:", err);
          if (mountedRef.current) {
            setItems((prev) => prev.filter((saved) => saved.id !== optimisticId));
          }
          return {
            ok: false,
            reason: err instanceof Error ? err.message : "Unknown error while saving item.",
          };
        }
      } else {
        console.log("SavedItems local save result:", optimisticItem);
        return { ok: true };
      }
    },
    [isRemoteMode, authUserId, user?.id, profile?.id, categories],
  );

  const deleteItem = useCallback(
    (id: string) => {
      if (isRemoteMode) {
        void (async () => {
          if (!user?.id) {
            Alert.alert("Delete failed", "Authenticated user is missing. Please sign in again.");
            return;
          }
          console.log("[DELETE] item id:", id);
          console.log("[DELETE] user id:", user.id);
          const { data, error } = await supabase
            .from("saved_items")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            .select("id");
          console.log("[DELETE] supabase result/error:", { data, error });
          if (error) {
            Alert.alert("Delete failed", error.message || "Could not delete saved item.");
            return;
          }
          setItems((prev) => prev.filter((i) => i.id !== id));
        })();
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [isRemoteMode, user?.id],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<SavedItem>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      if (isRemoteMode && authUserId) {
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
              (await upsertRemoteCategory(authUserId, updates.category)) ||
              categoryIdByName(updates.category);
            payload["category_id"] = isUuid(categoryId) ? categoryId : null;
          }
          if (Object.keys(payload).length > 0) {
            await supabase
              .from("saved_items")
              .update(payload)
              .eq("id", id)
              .eq("user_id", authUserId);
          }
        })();
      }
    },
    [isRemoteMode, authUserId, categories],
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

      if (isRemoteMode && authUserId) {
        void (async () => {
          const remoteId = await upsertRemoteCategory(authUserId, trimmedName);
          if (remoteId && mountedRef.current) {
            setCategories((prev) =>
              dedupeCategories(
                prev.map((cat) => (cat.id === newLocalId ? { ...cat, id: remoteId } : cat)),
              ),
            );
          }
        })();
      }
    },
    [isRemoteMode, authUserId],
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
          if (isRemoteMode && authUserId) {
            void supabase
              .from("categories")
              .update({ name: newName })
              .eq("id", id)
              .eq("user_id", authUserId);
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
    [isRemoteMode, authUserId]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (isRemoteMode && authUserId) {
        void supabase.from("categories").delete().eq("id", id).eq("user_id", authUserId);
      }
    },
    [isRemoteMode, authUserId],
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
