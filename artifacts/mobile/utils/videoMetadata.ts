export interface VideoMetadata {
  resolverVersion?: string;
  thumbnailUrl?: string;
  fallbackImageUrl?: string;
  title?: string;
  description?: string;
  url?: string;
  platform?: string;
  domain?: string;
  hasRealPreviewImage?: boolean;
  isFallback?: boolean;
}

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }

  return null;
}

export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function faviconUrl(url: string): string | undefined {
  const domain = extractDomain(url);
  if (!domain || !domain.includes(".")) return undefined;
  return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(
    domain
  )}`;
}

function cleanTitle(title?: string): string | undefined {
  if (!title) return undefined;

  return title
    .replace(/\s+/g, " ")
    .replace(/^Facebook$/, "")
    .replace(/^Instagram$/, "")
    .replace(/^TikTok$/, "")
    .trim()
    .slice(0, 140) || undefined;
}

function fallbackTitle(url: string, platform: string): string {
  const domain = extractDomain(url);

  switch (platform) {
    case "youtube":
      return "YouTube video";
    case "tiktok":
      return "TikTok video";
    case "instagram":
      return "Instagram post";
    case "facebook":
      return "Facebook video";
    case "pinterest":
      return "Pinterest saved idea";
    default:
      return domain;
  }
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com")) {
    return "facebook";
  }
  if (lower.includes("pinterest.com") || lower.includes("pin.it")) return "pinterest";
  return "website";
}

async function timedFetch(url: string, ms = 6500): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

function apiBaseUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!explicit) return null;
  return explicit.replace(/\/+$/, "");
}

export async function fetchPreview(url: string): Promise<VideoMetadata> {
  const normalized = normalizeUrl(url);
  const platform = detectPlatform(normalized);
  const domain = extractDomain(normalized);
  const defaultFallbackImage = faviconUrl(normalized);
  const defaultTitle = fallbackTitle(normalized, platform);
  const base = apiBaseUrl();

  console.log("fetchPreview input URL:", normalized);
  console.log("fetchPreview api base URL:", base);
  if (!base) {
    console.warn(
      "fetchPreview dev warning: EXPO_PUBLIC_API_BASE_URL is missing. Skipping /api/metadata request.",
    );
    return {
      title: defaultTitle,
      fallbackImageUrl: defaultFallbackImage,
      url: normalized,
      platform,
      domain,
      hasRealPreviewImage: false,
      isFallback: true,
    };
  }

  const endpoint = `${base}/api/metadata?url=${encodeURIComponent(normalized)}`;
  console.log("fetchPreview full endpoint URL:", endpoint);
  const res = await timedFetch(endpoint, 9000);
  console.log("fetchPreview metadata HTTP status:", res?.status ?? null);
  if (!res) {
    console.warn("fetchPreview dev warning: metadata request failed before HTTP response.");
    return {
      title: defaultTitle,
      fallbackImageUrl: defaultFallbackImage,
      url: normalized,
      platform,
      domain,
      hasRealPreviewImage: false,
      isFallback: true,
    };
  }

  try {
    const rawText = await res.text();
    console.log("fetchPreview metadata raw response text:", rawText);
    if (!res.ok) {
      return {
        title: defaultTitle,
        fallbackImageUrl: defaultFallbackImage,
        url: normalized,
        platform,
        domain,
        hasRealPreviewImage: false,
        isFallback: true,
      };
    }
    const data = rawText ? JSON.parse(rawText) : {};
    console.log("fetchPreview API response:", {
      inputUrl: normalized,
      data,
    });
    const resolvedUrl = typeof data?.url === "string" ? data.url : normalized;
    const resolvedPlatform = detectPlatform(resolvedUrl);
    const resolvedDomain = extractDomain(resolvedUrl);
    const title = cleanTitle(data?.title) || fallbackTitle(resolvedUrl, resolvedPlatform);
    const thumbnailUrl = typeof data?.thumbnailUrl === "string" ? data.thumbnailUrl : undefined;
    const fallbackImageUrl =
      typeof data?.fallbackImageUrl === "string" ? data.fallbackImageUrl : defaultFallbackImage;
    const preview: VideoMetadata = {
      resolverVersion:
        typeof data?.resolverVersion === "string" ? data.resolverVersion : undefined,
      title,
      thumbnailUrl,
      fallbackImageUrl,
      description:
        typeof data?.description === "string" ? data.description : undefined,
      url: resolvedUrl,
      platform: typeof data?.platform === "string" ? data.platform : resolvedPlatform,
      domain: typeof data?.domain === "string" ? data.domain : resolvedDomain,
      hasRealPreviewImage:
        typeof data?.hasRealPreviewImage === "boolean"
          ? data.hasRealPreviewImage
          : Boolean(thumbnailUrl),
      isFallback:
        typeof data?.isFallback === "boolean" ? data.isFallback : !thumbnailUrl,
    };
    console.log("fetchPreview resolverVersion:", preview.resolverVersion ?? null);
    if (!preview.resolverVersion) {
      console.log(
        "fetchPreview warning: resolverVersion missing from API response. Check API base URL/server target.",
      );
    }
    console.log("fetchPreview final preview:", preview);

    return preview;
  } catch {
    return {
      title: defaultTitle,
      fallbackImageUrl: defaultFallbackImage,
      url: normalized,
      platform,
      domain,
      hasRealPreviewImage: false,
      isFallback: true,
    };
  }
}

export async function fetchMetadata(url: string): Promise<VideoMetadata> {
  return fetchPreview(url);
}

export async function fetchVideoMetadata(
  url: string,
  platform: string
): Promise<VideoMetadata> {
  const normalized = normalizeUrl(url);
  const videoId = platform === "youtube" ? extractYoutubeId(normalized) : null;
  const ytThumbnail = videoId ? getYoutubeThumbnail(videoId) : undefined;
  const defaultFallbackImage = faviconUrl(normalized);
  const defaultTitle = fallbackTitle(normalized, platform);
  if (ytThumbnail) {
    return {
      title: defaultTitle,
      thumbnailUrl: ytThumbnail,
      fallbackImageUrl: defaultFallbackImage,
      platform,
      domain: extractDomain(normalized),
      hasRealPreviewImage: true,
      isFallback: false,
    };
  }

  const meta = await fetchMetadata(normalized);
  return {
    title: meta.title || defaultTitle,
    thumbnailUrl: meta.thumbnailUrl,
    fallbackImageUrl: meta.fallbackImageUrl || defaultFallbackImage,
    platform: meta.platform || platform,
    domain: meta.domain || extractDomain(normalized),
    hasRealPreviewImage: Boolean(meta.hasRealPreviewImage || meta.thumbnailUrl),
    isFallback:
      typeof meta.isFallback === "boolean" ? meta.isFallback : !meta.thumbnailUrl,
  };
}