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

async function timedFetch(url: string, ms = 8000): Promise<Response | null> {
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

/* ─── Source: noembed.com — CORS-safe oEmbed aggregator ─── */

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

/* ─── Source: Microlink — OG-tag extractor, server-side ─── */
/* Follows redirects automatically (pin.it, fb.watch, etc.) */

async function fetchMicrolink(url: string): Promise<{ title?: string; imageUrl?: string; description?: string }> {
  const res = await timedFetch(
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`
  );
  if (!res || !res.ok) return {};
  try {
    const json = await res.json();
    if (json?.status !== "success" || !json.data) return {};
    return {
      title: json.data.title || undefined,
      imageUrl: json.data.image?.url || json.data.logo?.url || undefined,
      description: json.data.description || undefined,
    };
  } catch {
    return {};
  }
}

/* ─── Source: Pinterest oEmbed ──────────────────────────── */
/*
 * Pinterest runs its own oEmbed endpoint that is CORS-enabled and
 * works for both full pinterest.com/pin/ URLs and some short links.
 * Returns title (pin description text) + thumbnail_url.
 */

async function fetchPinterestOembed(
  url: string
): Promise<{ title?: string; thumbnailUrl?: string }> {
  const res = await timedFetch(
    `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`
  );
  if (!res || !res.ok) return {};
  try {
    const data = await res.json();
    if (!data || data.error) return {};
    return {
      title: data.title || data.author_name || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
    };
  } catch {
    return {};
  }
}

/* ─── Pinterest: resolve pin.it short links ─────────────── */
/*
 * On native (iOS/Android), fetch() follows redirects and res.url
 * gives the final destination. On web (CORS) this silently falls
 * back to the original URL — all other sources still run in parallel.
 */

async function resolvePinIt(url: string): Promise<string> {
  if (!url.toLowerCase().includes("pin.it")) return url;
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(id);
    if (res.url && res.url !== url) return res.url;
  } catch {
    /* CORS or network — fall through */
  }
  return url;
}

/* ─── Pinterest main fetch ───────────────────────────────── */
/*
 * Strategy (all fired as fast as possible):
 *   Round 1 — three sources in parallel with the original URL
 *   Round 2 — if pin.it resolved to a different URL AND round 1
 *             yielded no image, run oEmbed + Microlink again with
 *             the resolved canonical URL
 *   Fallback — title: "Saved from Pinterest", thumbnail: undefined
 *             (VideoCard has a styled placeholder for missing thumbnails)
 */

async function fetchPinterestMeta(url: string): Promise<VideoMetadata> {
  /* Fire all three CORS-safe sources in parallel right away */
  const [oembedRes, mlRes, noembedRes, resolvedUrl] = await Promise.all([
    fetchPinterestOembed(url),
    fetchMicrolink(url),
    fetchNoembed(url),
    resolvePinIt(url),             /* also runs in parallel */
  ]);

  /* Merge round-1 results */
  let title =
    oembedRes.title ||
    mlRes.title ||
    noembedRes.title ||
    mlRes.description?.slice(0, 100) ||
    undefined;

  let thumbnailUrl =
    oembedRes.thumbnailUrl ||
    noembedRes.thumbnailUrl ||
    mlRes.imageUrl ||
    undefined;

  /* Round 2: if pin.it resolved and we still lack data, retry with canonical URL */
  if (resolvedUrl !== url && (!title || !thumbnailUrl)) {
    const [oe2, ml2] = await Promise.all([
      fetchPinterestOembed(resolvedUrl),
      fetchMicrolink(resolvedUrl),
    ]);
    if (!title) title = oe2.title || ml2.title || ml2.description?.slice(0, 100);
    if (!thumbnailUrl) thumbnailUrl = oe2.thumbnailUrl || ml2.imageUrl;
  }

  /* Guaranteed fallbacks — always return something useful */
  return {
    title: title || "Saved from Pinterest",
    thumbnailUrl,
  };
}

/* ─── Main export ─────────────────────────────────────────── */

export async function fetchVideoMetadata(
  url: string,
  platform: string
): Promise<VideoMetadata> {
  /* Pinterest: custom multi-source resolver */
  if (platform === "pinterest") {
    return fetchPinterestMeta(url);
  }

  /* YouTube: always build the direct thumbnail immediately (no network needed) */
  const videoId = platform === "youtube" ? extractYoutubeId(url) : null;
  const ytThumbnail = videoId ? getYoutubeThumbnail(videoId) : undefined;

  /* Generic websites: only Microlink works (noembed handles only video embeds) */
  if (platform === "website") {
    const ml = await fetchMicrolink(url);
    return { title: ml.title, thumbnailUrl: ml.imageUrl };
  }

  /* Social platforms: fire both in parallel for speed */
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
