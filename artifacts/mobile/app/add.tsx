import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSavedItems } from "@/contexts/SavedItemsContext";
import {
  extractYoutubeId,
  fetchPreview,
  getYoutubeThumbnail,
  VideoMetadata,
} from "@/utils/videoMetadata";
import { nextQaSequence, qaLog } from "@/utils/qaDebugLog";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

type PlatformType =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "website"
  | "pinterest";

const PLATFORM_COLORS: Record<PlatformType, string> = {
  youtube: "#EF4444",
  tiktok: "#22D3EE",
  instagram: "#D946EF",
  facebook: "#8B5CF6",
  website: "#6366F1",
  pinterest: "#E60023",
};

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Feather.glyphMap> = {
  youtube: "play-circle",
  tiktok: "video",
  instagram: "camera",
  facebook: "users",
  website: "globe",
  pinterest: "bookmark",
};

const PLATFORM_NAMES: Record<PlatformType, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  pinterest: "Pinterest",
};

const PLATFORM_DESC: Record<PlatformType, string> = {
  youtube: "YouTube video",
  tiktok: "TikTok video",
  instagram: "Instagram post",
  facebook: "Facebook video",
  website: "Web page",
  pinterest: "Pinterest pin",
};

const FALLBACK_CATEGORY_COLORS = [
  "#D946EF",
  "#8B5CF6",
  "#22D3EE",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

const REMINDER_OPTIONS = [
  { label: "Tomorrow", getValue: () => Date.now() + 86400000 },
  {
    label: "Weekend",
    getValue: () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      return Date.now() + daysUntilSat * 86400000;
    },
  },
  { label: "Next week", getValue: () => Date.now() + 7 * 86400000 },
];

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

function detectPlatform(url: string): PlatformType | null {
  if (!url.trim()) return null;
  const lower = url.toLowerCase();

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }

  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";

  if (
    lower.includes("facebook.com") ||
    lower.includes("fb.watch") ||
    lower.includes("fb.com")
  ) {
    return "facebook";
  }

  if (
    lower.includes("pinterest.com") ||
    lower.includes("pinterest.co") ||
    lower.includes("pin.it")
  ) {
    return "pinterest";
  }

  if (isValidUrl(url)) return "website";

  return null;
}

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(normalizeUrl(url));
    return hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 28);
  }
}

function faviconUrl(url: string): string | undefined {
  try {
    const domain = extractDomain(url);
    if (!domain || !domain.includes(".")) return undefined;
    return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(
      domain
    )}`;
  } catch {
    return undefined;
  }
}

function smartFallbackTitle(
  url: string,
  platform: PlatformType | null,
  metaTitle?: string
) {
  if (metaTitle?.trim()) return metaTitle.trim();

  const domain = extractDomain(url);

  if (platform === "tiktok") return "TikTok video";
  if (platform === "instagram") return "Instagram post";
  if (platform === "facebook") return "Facebook video";
  if (platform === "pinterest") return "Pinterest idea";
  if (platform === "youtube") return "YouTube video";
  if (platform === "website") return domain;

  return `Saved from ${domain}`;
}

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function decodePossiblyEncoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractFirstHttpUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s<>"')\]}]+/i);
  if (!match?.[0]) return undefined;
  return match[0].replace(/[),.;!?]+$/, "");
}

function resolveIncomingUrlCandidate(rawValue: string): string {
  const decoded = decodePossiblyEncoded(rawValue).trim();
  const extracted = extractFirstHttpUrl(decoded);
  return extracted ?? decoded;
}

function hasValidPreview(meta?: VideoMetadata | null): boolean {
  if (!meta) return false;
  return Boolean(meta.title?.trim() || meta.thumbnailUrl);
}

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { url: incomingUrlParam, text: incomingTextParam } = useLocalSearchParams<{
    url?: string | string[];
    text?: string | string[];
  }>();
  const { categories, addItem, addCategory } = useSavedItems();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.name || ""
  );
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<number | undefined>(undefined);
  const [showCustomDate, setShowCustomDate] = useState(false);

  const [fetchedMeta, setFetchedMeta] = useState<VideoMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);

  const [urlError, setUrlError] = useState("");
  const [titleError, setTitleError] = useState("");

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const userTypedTitle = useRef(false);
  const lastAutoFilledTitle = useRef("");
  const requestIdRef = useRef(0);
  const prevUrlRef = useRef("");
  const appliedIncomingUrlRef = useRef("");

  const detectedPlatform = detectPlatform(url);
  const platformColor = detectedPlatform
    ? PLATFORM_COLORS[detectedPlatform]
    : "#6366F1";
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const saveFooterBottomSpacing = Math.max(insets.bottom, 24) + 16;

  const displayThumbnailUrl = useMemo(() => {
    if (!url.trim() || !isValidUrl(url)) return undefined;

    const resolvedMetaImage =
      fetchedMeta?.thumbnailUrl || fetchedMeta?.fallbackImageUrl;

    if (resolvedMetaImage && !previewImgError) {
      return resolvedMetaImage;
    }

    if (detectedPlatform === "youtube") {
      const videoId = extractYoutubeId(normalizeUrl(url));
      if (videoId) return getYoutubeThumbnail(videoId);
    }

    return faviconUrl(url);
  }, [
    url,
    fetchedMeta?.thumbnailUrl,
    fetchedMeta?.fallbackImageUrl,
    previewImgError,
    detectedPlatform,
  ]);

  const hasPreviewThumbnail =
    Boolean(fetchedMeta?.thumbnailUrl || (detectedPlatform === "youtube" && displayThumbnailUrl)) &&
    !previewImgError;
  const hasPreviewFallback =
    Boolean(fetchedMeta?.fallbackImageUrl) && !hasPreviewThumbnail && !previewImgError;
  const previewStatusText = hasPreviewThumbnail
    ? "Preview ready"
    : hasPreviewFallback
      ? "Preview limited"
      : "Link saved";
  const trimmedCategorySearch = categorySearchQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(trimmedCategorySearch)
  );

  useEffect(() => {
    const rawIncomingUrl = Array.isArray(incomingUrlParam)
      ? incomingUrlParam[0]
      : incomingUrlParam;
    const rawIncomingText = Array.isArray(incomingTextParam)
      ? incomingTextParam[0]
      : incomingTextParam;
    const rawIncoming = rawIncomingUrl || rawIncomingText;
    if (!rawIncoming || typeof rawIncoming !== "string") return;

    const resolvedIncoming = resolveIncomingUrlCandidate(rawIncoming);

    if (!resolvedIncoming || appliedIncomingUrlRef.current === resolvedIncoming) {
      return;
    }

    // Beta support for "Share to Vexo" via deep links:
    // vexo://add?url=<encoded-url>. Full native share extension can be added later.
    appliedIncomingUrlRef.current = resolvedIncoming;
    setUrl(resolvedIncoming);
    setUrlError("");
  }, [incomingUrlParam, incomingTextParam]);

  useEffect(() => {
    if (!selectedCategory && categories[0]?.name) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    const normalizedCurrent = normalizeUrl(url);
    qaLog("METADATA", "URL entered", { url: normalizedCurrent });

    if (normalizedCurrent !== prevUrlRef.current) {
      prevUrlRef.current = normalizedCurrent;
      setPreviewImgError(false);

      if (!url.trim()) {
        userTypedTitle.current = false;
        lastAutoFilledTitle.current = "";
        setTitle("");
      }
    }
  }, [url]);

  useEffect(() => {
    const trimmedUrl = url.trim();
    console.log("AddScreen metadata effect input URL:", trimmedUrl);

    if (!trimmedUrl || !detectedPlatform || !isValidUrl(trimmedUrl)) {
      requestIdRef.current += 1;
      setFetchedMeta(null);
      setMetaLoading(false);
      setPreviewImgError(false);
      return;
    }

    const normalized = normalizeUrl(trimmedUrl);
    console.log("[METADATA DEBUG] before metadata fetch URL:", normalized);
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    const metadataSequence = nextQaSequence("METADATA");
    const fetchStartedAt = Date.now();
    qaLog("METADATA", "metadata fetch start", {
      sequence: metadataSequence,
      requestId: currentRequestId,
      url: normalized,
    });

    setMetaLoading(true);
    setPreviewImgError(false);

    setFetchedMeta((prev) => {
      if (detectedPlatform === "youtube") {
        const videoId = extractYoutubeId(normalized);
        if (videoId) {
          return {
            title: prev?.title,
            thumbnailUrl: getYoutubeThumbnail(videoId),
            hasRealPreviewImage: true,
            isFallback: false,
          };
        }
      }

      return prev || {};
    });

    const instantFallback = smartFallbackTitle(normalized, detectedPlatform);

    setTitle((current) => {
      const shouldFill =
        !userTypedTitle.current ||
        current.trim() === "" ||
        current === lastAutoFilledTitle.current;

      if (!shouldFill) return current;

      lastAutoFilledTitle.current = instantFallback;
      return instantFallback;
    });

    let cancelled = false;

    const timer = setTimeout(async () => {
      const TIMEOUT_MS = 9000;

      const timeoutPromise = new Promise<VideoMetadata>((resolve) =>
        setTimeout(() => resolve({}), TIMEOUT_MS)
      );

      let meta: VideoMetadata = {};

      try {
        meta = await Promise.race([
          fetchPreview(normalized),
          timeoutPromise,
        ]);
      } catch {
        meta = {};
      }
      const elapsedMs = Date.now() - fetchStartedAt;
      qaLog("METADATA", "metadata fetch result", {
        sequence: metadataSequence,
        requestId: currentRequestId,
        elapsedMs,
        titleExists: !!meta.title?.trim(),
        thumbnailExists: !!meta.thumbnailUrl,
        fallbackImageExists: !!meta.fallbackImageUrl,
      });
      console.log("[METADATA DEBUG] after metadata fetch result:", meta);
      console.log("AddScreen metadata returned:", {
        inputUrl: normalized,
        meta,
      });
      console.log("RAW API RESPONSE:", meta);

      if (cancelled || requestIdRef.current !== currentRequestId) {
        console.log("PREVIEW IGNORED (stale)");
        return;
      }

      const fallback = smartFallbackTitle(
        normalized,
        detectedPlatform,
        meta.title
      );

      setFetchedMeta((prev) => {
        const hasPrevSuccess = hasValidPreview(prev);
        const hasIncomingSuccess = hasValidPreview(meta);
        const incomingExactApiResult =
          meta.isFallback === false &&
          (Boolean(meta.title?.trim()) || Boolean(meta.thumbnailUrl));

        if (!hasIncomingSuccess && hasPrevSuccess) {
          console.log("PREVIEW FAILED");
          return prev;
        }

        if (incomingExactApiResult) {
          const exactPreview: VideoMetadata = {
            title: meta.title || prev?.title,
            thumbnailUrl: meta.thumbnailUrl || prev?.thumbnailUrl,
            fallbackImageUrl:
              meta.fallbackImageUrl || prev?.fallbackImageUrl || faviconUrl(normalized),
            hasRealPreviewImage:
              typeof meta.hasRealPreviewImage === "boolean"
                ? meta.hasRealPreviewImage
                : Boolean(meta.thumbnailUrl),
            isFallback: false,
            platform: meta.platform || prev?.platform,
            domain: meta.domain || prev?.domain,
            description: meta.description || prev?.description,
            url: meta.url || prev?.url,
          };
          console.log("PREVIEW SUCCESS", exactPreview);
          return exactPreview;
        }

        const next: VideoMetadata = {
          title: hasIncomingSuccess
            ? meta.title || prev?.title || fallback
            : prev?.title || fallback,
          // Never let fallback image override an existing valid thumbnail.
          thumbnailUrl: meta.thumbnailUrl || prev?.thumbnailUrl,
          fallbackImageUrl:
            meta.fallbackImageUrl ||
            prev?.fallbackImageUrl ||
            faviconUrl(normalized),
          hasRealPreviewImage:
            typeof meta.hasRealPreviewImage === "boolean"
              ? meta.hasRealPreviewImage
              : prev?.hasRealPreviewImage,
          isFallback:
            typeof meta.isFallback === "boolean"
              ? meta.isFallback
              : prev?.isFallback,
          platform: meta.platform || prev?.platform,
          domain: meta.domain || prev?.domain,
          description: meta.description || prev?.description,
          url: meta.url || prev?.url,
        };

        if (hasValidPreview(next)) {
          console.log("PREVIEW SUCCESS", next);
          return next;
        }

        console.log("PREVIEW FAILED");
        return prev ?? next;
      });
      console.log("AddScreen preview state before save-ready:", {
        inputUrl: normalized,
        titleAfterFetch: fallback,
        fetchedMeta: meta,
      });

      setMetaLoading(false);

      setTitle((current) => {
        if (meta.isFallback === false && meta.title?.trim()) {
          const shouldFillFromApi =
            !userTypedTitle.current ||
            current.trim() === "" ||
            current === lastAutoFilledTitle.current ||
            current === instantFallback;
          if (shouldFillFromApi) {
            lastAutoFilledTitle.current = meta.title.trim();
            return meta.title.trim();
          }
        }

        const hasExistingPreviewTitle = Boolean(fetchedMeta?.title?.trim());
        const hasIncomingPreviewTitle = Boolean(meta.title?.trim());
        if (hasExistingPreviewTitle && !hasIncomingPreviewTitle) {
          return current;
        }

        const shouldFill =
          !userTypedTitle.current ||
          current.trim() === "" ||
          current === lastAutoFilledTitle.current ||
          current === instantFallback;

        if (!shouldFill) return current;

        lastAutoFilledTitle.current = fallback;
        return fallback;
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, detectedPlatform]);

  function handleCreateCategory() {
    const cleanName = newCategoryName.trim();

    if (!cleanName) {
      setCategoryError("Enter a category name");
      return;
    }

    const existingCategory = categories.find(
      (cat) => normalizeCategoryName(cat.name) === normalizeCategoryName(cleanName)
    );

    if (existingCategory) {
      setCategoryError("Category already exists");
      setSelectedCategory(existingCategory.name);
      setNewCategoryName("");
      setCreatingCategory(false);
      Alert.alert("Category already exists");
      return;
    }

    const color =
      FALLBACK_CATEGORY_COLORS[
        categories.length % FALLBACK_CATEGORY_COLORS.length
      ];

    addCategory({
      name: cleanName,
      color,
      icon: "folder",
    });

    setSelectedCategory(cleanName);
    setNewCategoryName("");
    setCreatingCategory(false);
    setCategoryError("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function closeAddScreen() {
    router.replace("/");
  }

  async function handleSave() {
    if (isSaving) return;
    let valid = true;
    const normalized = normalizeUrl(url);
    const selectedCategoryMatch = categories.find(
      (cat) =>
        normalizeCategoryName(cat.name) === normalizeCategoryName(selectedCategory)
    );

    if (!url.trim()) {
      setUrlError("Please paste a link before saving");
      valid = false;
    } else if (!isValidUrl(url)) {
      setUrlError("That doesn't look like a valid URL");
      valid = false;
    } else {
      setUrlError("");
    }

    const finalTitle =
      title.trim() ||
      fetchedMeta?.title?.trim() ||
      smartFallbackTitle(normalized, detectedPlatform);
    if (!title.trim() && !fetchedMeta?.title?.trim()) {
      qaLog("METADATA", "fallback title used", {
        reason: "manual title empty and fetched metadata title missing",
        platform: detectedPlatform,
        url: normalized,
        fallbackTitle: finalTitle,
      });
      console.log("[METADATA DEBUG] fallback title used:", {
        reason: "manual title empty and fetched metadata title missing",
        platform: detectedPlatform,
        url: normalized,
        fallbackTitle: finalTitle,
      });
    }

    if (!finalTitle.trim()) {
      setTitleError("Please add a title before saving");
      valid = false;
    } else {
      setTitleError("");
    }

    if (!selectedCategoryMatch) {
      setCategoryError("Please choose or create a category");
      valid = false;
    } else {
      setCategoryError("");
    }

    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const finalCategoryName =
      selectedCategoryMatch?.name || selectedCategory.trim();

    let thumbnailUrl =
      fetchedMeta?.thumbnailUrl ||
      fetchedMeta?.fallbackImageUrl ||
      displayThumbnailUrl ||
      faviconUrl(normalized);

    if (!thumbnailUrl && detectedPlatform === "youtube") {
      const videoId = extractYoutubeId(normalized);
      if (videoId) thumbnailUrl = getYoutubeThumbnail(videoId);
    }

    console.log("AddScreen metadata before save:", {
      url: normalized,
      detectedPlatform,
      fetchedMeta,
      displayThumbnailUrl,
      previewTitle,
      finalTitle,
      thumbnailUrl,
    });

    const addPayload = {
      url: normalized,
      title: finalTitle,
      platform: detectedPlatform ?? "website",
      category: finalCategoryName,
      notes: notes.trim(),
      thumbnailColor: platformColor || "#8B5CF6",
      thumbnailUrl,
      reminder,
    };
    console.log("[METADATA DEBUG] before save:", {
      finalTitle,
      thumbnail_url: addPayload.thumbnailUrl,
      url: addPayload.url,
    });
    qaLog("METADATA", "final title/thumbnail saved", {
      finalTitle,
      thumbnailUrl: addPayload.thumbnailUrl ?? null,
      url: addPayload.url,
    });
    console.log("AddScreen addItem payload:", addPayload);

    setIsSaving(true);
    const result = await addItem({
      ...addPayload,
    });
    setIsSaving(false);

    if (!result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Save failed", result.reason || "Could not save this item.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved successfully", "Your item was saved.", [
      {
        text: "OK",
        onPress: closeAddScreen,
      },
    ]);
  }

  function formatReminder(ts: number) {
    return new Date(ts).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const previewTitle =
    fetchedMeta?.title ||
    (url.trim() && detectedPlatform
      ? smartFallbackTitle(url, detectedPlatform)
      : undefined);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Save Video",
          headerLeft: () => (
            <Pressable
              onPress={closeAddScreen}
              hitSlop={10}
              style={{ paddingHorizontal: 4 }}
            >
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { flexGrow: 1, paddingBottom: bottomPadding + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        enableOnAndroid={true}
        extraScrollHeight={120}
        extraHeight={120}
      >
        <View style={styles.section}>
          <Text style={styles.label}>VIDEO LINK</Text>

          <View
            style={[
              styles.inputRow,
              urlError
                ? styles.inputRowError
                : detectedPlatform
                  ? { borderColor: platformColor + "40" }
                  : null,
            ]}
          >
            <Feather
              name={urlError ? "alert-circle" : "link-2"}
              size={15}
              color={
                urlError ? "#F87171" : platformColor || "rgba(255,255,255,0.28)"
              }
            />

            <TextInput
              value={url}
              onChangeText={(t) => {
                setUrl(t);
                if (urlError) setUrlError("");
              }}
              placeholder="Paste any link — YouTube, article, recipe…"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.inputText}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {!!urlError && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={12} color="#F87171" />
              <Text style={styles.errorText}>{urlError}</Text>
            </View>
          )}
        </View>

        <View style={styles.previewCard}>
          {detectedPlatform ? (
            <>
              {displayThumbnailUrl && !previewImgError ? (
                <>
                  <Image
                    source={{ uri: displayThumbnailUrl }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    resizeMode={
                      displayThumbnailUrl.includes("google.com/s2/favicons")
                        ? "center"
                        : "cover"
                    }
                    onError={() => setPreviewImgError(true)}
                  />
                  <LinearGradient
                    colors={["rgba(6,8,20,0.18)", "rgba(6,8,20,0.74)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />
                </>
              ) : (
                <>
                  <LinearGradient
                    colors={["#D946EF1A", "#8B5CF610", "#22D3EE1A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />
                  <LinearGradient
                    colors={[platformColor + "28", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.7, y: 0.7 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />

                  <View style={styles.previewFallbackCenter}>
                    <View
                      style={[
                        styles.previewFallbackIconWrap,
                        {
                          borderColor: platformColor + "50",
                          backgroundColor: platformColor + "18",
                        },
                      ]}
                    >
                      <Feather
                        name={PLATFORM_ICONS[detectedPlatform]}
                        size={24}
                        color={platformColor}
                      />
                    </View>

                    <Text
                      style={[
                        styles.previewFallbackDomain,
                        { color: platformColor + "BB" },
                      ]}
                    >
                      {extractDomain(url)}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.previewTop}>
                <View
                  style={[
                    styles.previewPlatformBadge,
                    {
                      backgroundColor: platformColor + "28",
                      borderColor: platformColor + "50",
                    },
                  ]}
                >
                  <Feather
                    name={PLATFORM_ICONS[detectedPlatform]}
                    size={12}
                    color={platformColor}
                  />
                  <Text
                    style={[
                      styles.previewPlatformText,
                      { color: platformColor },
                    ]}
                  >
                    {PLATFORM_NAMES[detectedPlatform]}
                  </Text>
                </View>

                <View style={styles.previewConfirmed}>
                  {metaLoading ? (
                    <ActivityIndicator size="small" color="#A5F3FC" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={12} color="#34D399" />
                      <Text style={styles.previewConfirmedText}>
                        {previewStatusText}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {displayThumbnailUrl && !previewImgError ? (
                <View style={styles.previewPlayArea}>
                  <View
                    style={[
                      styles.previewPlayBtn,
                      { borderColor: "rgba(255,255,255,0.35)" },
                    ]}
                  >
                    <Feather
                      name="play"
                      size={20}
                      color="#fff"
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ height: 16 }} />
              )}

              <Text style={styles.previewDesc} numberOfLines={2}>
                {previewTitle || PLATFORM_DESC[detectedPlatform]}
              </Text>

              <Text style={styles.previewUrl} numberOfLines={1}>
                {url}
              </Text>
            </>
          ) : (
            <View style={styles.previewEmpty}>
              <Feather name="video" size={28} color="rgba(255,255,255,0.14)" />
              <Text style={styles.previewEmptyText}>Video preview</Text>
              <Text style={styles.previewEmptySub}>
                Paste a link above to see a preview
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.titleLabelRow}>
            <Text style={styles.label}>TITLE</Text>

            {metaLoading && (
              <View style={styles.titleFetchingBadge}>
                <ActivityIndicator
                  size="small"
                  color="#A5F3FC"
                  style={{ transform: [{ scale: 0.65 }] }}
                />
                <Text style={styles.titleFetchingText}>fetching title…</Text>
              </View>
            )}

            {!metaLoading && title.trim().length > 0 && (
              <View style={styles.titleAutoFilledBadge}>
                <Feather name="zap" size={10} color="#34D399" />
                <Text style={styles.titleAutoFilledText}>ready</Text>
              </View>
            )}
          </View>

          <TextInput
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              userTypedTitle.current = true;
              if (titleError) setTitleError("");
            }}
            placeholder={
              metaLoading && detectedPlatform
                ? "Fetching title from link…"
                : "Give it a memorable title"
            }
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, titleError ? styles.inputError : null]}
          />

          {!!titleError && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={12} color="#F87171" />
              <Text style={styles.errorText}>{titleError}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>CATEGORY</Text>
          <TextInput
            value={categorySearchQuery}
            onChangeText={setCategorySearchQuery}
            placeholder="Search category"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.categorySearchInput}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            <View style={styles.chipRow}>
              {filteredCategories.map((cat) => {
                const active = selectedCategory === cat.name;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat.name);
                      setCategoryError("");
                    }}
                    style={[
                      styles.catChip,
                      active && {
                        backgroundColor: "#D946EF15",
                        borderColor: "rgba(217,70,239,0.35)",
                      },
                    ]}
                  >
                    <Feather
                      name={cat.icon as keyof typeof Feather.glyphMap}
                      size={12}
                      color={active ? "#D946EF" : "rgba(255,255,255,0.35)"}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        active && { color: "#fff" },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setCreatingCategory(true);
                  setCategoryError("");
                }}
                style={styles.newCatChip}
              >
                <Feather name="plus" size={13} color="#A5F3FC" />
                <Text style={styles.newCatChipText}>New category</Text>
              </Pressable>
            </View>
          </ScrollView>
          {trimmedCategorySearch.length > 0 && filteredCategories.length === 0 && (
            <Text style={styles.categorySearchEmptyText}>No categories found</Text>
          )}
          {creatingCategory && (
            <View style={styles.newCategoryBox}>
              <View style={styles.newCategoryInputRow}>
                <Feather name="folder-plus" size={15} color="#A5F3FC" />

                <TextInput
                  value={newCategoryName}
                  onChangeText={(text) => {
                    setNewCategoryName(text);
                    if (categoryError) setCategoryError("");
                  }}
                  placeholder="Category name"
                  placeholderTextColor="rgba(255,255,255,0.30)"
                  style={styles.newCategoryInput}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleCreateCategory}
                />
              </View>

              <View style={styles.newCategoryActions}>
                <Pressable
                  onPress={() => {
                    setCreatingCategory(false);
                    setNewCategoryName("");
                    setCategoryError("");
                  }}
                  style={styles.newCategoryCancel}
                >
                  <Text style={styles.newCategoryCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateCategory}
                  style={styles.newCategoryCreate}
                >
                  <Text style={styles.newCategoryCreateText}>Create</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!!categoryError && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={12} color="#F87171" />
              <Text style={styles.errorText}>{categoryError}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>NOTES</Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes, timestamps, or thoughts..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.textArea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.reminderLabelRow}>
            <Text style={styles.label}>🔔  REMINDER</Text>
            <Text style={styles.optionalLabel}>Optional</Text>
          </View>

          <View style={styles.reminderGrid}>
            {REMINDER_OPTIONS.map((opt) => {
              const val = opt.getValue();
              const active =
                reminder !== undefined && Math.abs(reminder - val) < 3600000;

              return (
                <Pressable
                  key={opt.label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReminder(active ? undefined : val);
                    setShowCustomDate(false);
                  }}
                  style={[
                    styles.reminderCell,
                    active && styles.reminderCellActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderCellText,
                      active && { color: "#A5F3FC" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowCustomDate(!showCustomDate);
              }}
              style={[
                styles.reminderCell,
                styles.reminderCellCustom,
                showCustomDate && styles.reminderCellActive,
              ]}
            >
              <Text style={[styles.reminderCellText, { color: "#A5F3FC" }]}>
                Pick date
              </Text>
            </Pressable>
          </View>

          {reminder && (
            <View style={styles.reminderSet}>
              <Feather name="bell" size={12} color="#A5F3FC" />
              <Text style={styles.reminderSetText}>
                Reminder: {formatReminder(reminder)}
              </Text>
              <Pressable onPress={() => setReminder(undefined)} hitSlop={8}>
                <Feather name="x" size={12} color="rgba(255,255,255,0.35)" />
              </Pressable>
            </View>
          )}

          {showCustomDate && Platform.OS !== "web" && (
            <DateTimePicker
              value={
                reminder ? new Date(reminder) : new Date(Date.now() + 86400000)
              }
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowCustomDate(false);
                if (date) setReminder(date.getTime());
              }}
              themeVariant="dark"
            />
          )}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveWrap,
            { marginBottom: saveFooterBottomSpacing },
            { opacity: isSaving ? 0.7 : pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#D946EF", "#8B5CF6", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveBtnText}>Saving...</Text>
              </>
            ) : (
              <>
                <Feather name="bookmark" size={17} color="#fff" />
                <Text style={styles.saveBtnText}>Save to Vexo Save</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 22 },
  section: { gap: 10 },

  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
  },

  titleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleFetchingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  titleFetchingText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(165,243,252,0.60)",
  },

  titleAutoFilledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.10)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.20)",
  },

  titleAutoFilledText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#34D399",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },

  inputRowError: {
    borderColor: "rgba(248,113,113,0.55)",
    backgroundColor: "rgba(248,113,113,0.05)",
  },

  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    paddingVertical: 0,
  },

  input: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },

  inputError: {
    borderColor: "rgba(248,113,113,0.55)",
    backgroundColor: "rgba(248,113,113,0.05)",
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },

  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#F87171",
    flex: 1,
  },

  textArea: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    minHeight: 90,
    textAlignVertical: "top",
  },

  previewCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 170,
    overflow: "hidden",
    padding: 16,
    gap: 10,
  },

  previewFallbackCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  previewFallbackIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  previewFallbackDomain: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },

  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewPlatformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    gap: 5,
  },

  previewPlatformText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  previewConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  previewConfirmedText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#34D399",
  },

  previewPlayArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  previewPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  previewDesc: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
  },

  previewUrl: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.30)",
    textAlign: "center",
  },

  previewEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },

  previewEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.20)",
  },

  previewEmptySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.15)",
    textAlign: "center",
  },

  chipScroll: { marginHorizontal: -20 },
  categorySearchInput: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  categorySearchEmptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.50)",
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },

  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: 6,
  },

  catChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.55)",
  },

  newCatChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.35)",
    backgroundColor: "rgba(34,211,238,0.08)",
    gap: 6,
  },

  newCatChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#A5F3FC",
  },

  newCategoryBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.22)",
    backgroundColor: "rgba(34,211,238,0.06)",
    padding: 12,
    gap: 10,
  },

  newCategoryInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  newCategoryInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },

  newCategoryActions: {
    flexDirection: "row",
    gap: 10,
  },

  newCategoryCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  newCategoryCancelText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  newCategoryCreate: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: "rgba(139,92,246,0.90)",
  },

  newCategoryCreateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  reminderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionalLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#A5F3FC",
    opacity: 0.8,
  },

  reminderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  reminderCell: {
    width: "47%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },

  reminderCellActive: {
    borderColor: "rgba(217,70,239,0.35)",
    backgroundColor: "rgba(217,70,239,0.10)",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  reminderCellCustom: {
    borderStyle: "dashed",
    borderColor: "rgba(165,243,252,0.30)",
    backgroundColor: "rgba(34,211,238,0.10)",
  },

  reminderCellText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.80)",
  },

  reminderSet: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.20)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },

  reminderSetText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#A5F3FC",
  },

  cancelBtn: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.60)",
  },

  saveWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 9,
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});