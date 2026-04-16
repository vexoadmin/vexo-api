export interface VideoMetadata {
  thumbnailUrl?: string;
  title?: string;
}

/* ─── YouTube direct thumbnail (always available, no CORS) ── */

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

/* ─── Helper: abort-safe fetch with timeout ─────────────── */

async function timedFetch(url: string, ms = 6000): Promise<Response | null> {
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

/* ─── Source 1: noembed.com — CORS-safe oEmbed aggregator ── */
/* Works for: YouTube, TikTok, Vimeo, and many others       */

async function fetchNoembed(url: string): Promise<{ title?: string; thumbnailUrl?: string }> {
  const res = await timedFetch(
    `https://noembed.com/embed?url=${encodeURIComponent(url)}`
  );
  if (!res || !res.ok) return {};
  try {
    const data = await res.json();
    if (data?.error) return {};
    return {
      title: data.title || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
    };
  } catch {
    return {};
  }
}

/* ─── Source 2: Microlink — OG-tag extractor, all platforms ─ */

async function fetchMicrolink(url: string): Promise<{ title?: string; imageUrl?: string }> {
  const res = await timedFetch(
    `https://api.microlink.io/?url=${encodeURIComponent(url)}`
  );
  if (!res || !res.ok) return {};
  try {
    const json = await res.json();
    if (json?.status !== "success" || !json.data) return {};
    return {
      title: json.data.title || undefined,
      imageUrl: json.data.image?.url || undefined,
    };
  } catch {
    return {};
  }
}

/* ─── Main export ─────────────────────────────────────────── */

export async function fetchVideoMetadata(
  url: string,
  platform: "youtube" | "tiktok" | "instagram" | "facebook"
): Promise<VideoMetadata> {
  /* YouTube: always build the direct thumbnail immediately (no network needed) */
  const videoId = platform === "youtube" ? extractYoutubeId(url) : null;
  const ytThumbnail = videoId ? getYoutubeThumbnail(videoId) : undefined;

  /* Fire both metadata sources in parallel for speed */
  const [noembedResult, mlResult] = await Promise.allSettled([
    fetchNoembed(url),
    fetchMicrolink(url),
  ]);

  const noembed = noembedResult.status === "fulfilled" ? noembedResult.value : {};
  const ml = mlResult.status === "fulfilled" ? mlResult.value : {};

  /* Best title: noembed is more reliable for video platforms, ml covers the rest */
  const title = noembed.title || ml.title || undefined;

  /* Best thumbnail: noembed > microlink > YouTube direct URL */
  const thumbnailUrl = noembed.thumbnailUrl || ml.imageUrl || ytThumbnail || undefined;

  return { title, thumbnailUrl };
}
