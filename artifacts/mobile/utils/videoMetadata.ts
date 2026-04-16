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
/* Server-side: follows redirects automatically (pin.it etc) */

async function fetchMicrolink(url: string): Promise<{ title?: string; imageUrl?: string; description?: string }> {
  /* Use &meta=true for Pinterest to also get description-based title fallback */
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

/* ─── Source 3: Pinterest-specific — resolve pin.it then Microlink ─ */
/*
 * pin.it short links redirect (301/302) to the full pinterest.com URL.
 * fetch() in React Native DOES follow redirects natively, so we can
 * resolve the final URL ourselves and pass it to Microlink for OG extraction.
 * Microlink also follows redirects server-side, so passing pin.it directly
 * also works — but passing the resolved URL gives faster, more reliable results.
 */

async function resolvePinIt(url: string): Promise<string> {
  const lower = url.toLowerCase();
  if (!lower.includes("pin.it")) return url;
  try {
    /* React Native fetch follows redirects — read the final response URL */
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      method: "GET",
      redirect: "follow",
    });
    clearTimeout(id);
    /* res.url is the final URL after all redirects */
    if (res.url && res.url !== url) return res.url;
  } catch {
    /* fall through — just use original URL */
  }
  return url;
}

async function fetchPinterestMeta(url: string): Promise<{ title?: string; thumbnailUrl?: string }> {
  /* Step 1: resolve short link to the canonical Pinterest URL */
  const resolvedUrl = await resolvePinIt(url);

  /* Step 2: pass the resolved (or original) URL to Microlink */
  const ml = await fetchMicrolink(resolvedUrl);

  /* Step 3: build best result — title from og:title or description; image from og:image */
  const title = ml.title || ml.description?.slice(0, 80) || undefined;
  const thumbnailUrl = ml.imageUrl || undefined;

  return { title, thumbnailUrl };
}

/* ─── Main export ─────────────────────────────────────────── */

export async function fetchVideoMetadata(
  url: string,
  platform: string
): Promise<VideoMetadata> {
  /* YouTube: always build the direct thumbnail immediately (no network needed) */
  const videoId = platform === "youtube" ? extractYoutubeId(url) : null;
  const ytThumbnail = videoId ? getYoutubeThumbnail(videoId) : undefined;

  /* Pinterest: custom resolver to handle pin.it short links */
  if (platform === "pinterest") {
    return fetchPinterestMeta(url);
  }

  /* Generic websites: only microlink works (noembed only handles video embeds) */
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
