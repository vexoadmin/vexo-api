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

async function timedFetch(url: string, ms = 5000): Promise<Response | null> {
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

/* ─── Pinterest: HTML scrape via CORS proxy ─────────────── */
/*
 * AllOrigins fetches the Pinterest page server-side and returns the
 * raw HTML. We parse og:image / og:title with regex. This is the most
 * reliable way to get the actual pin image since Pinterest's CDN URLs
 * are embedded in the og:image tag.
 *
 * If AllOrigins fails, returns {} — the rest of the fallback chain is
 * completely unaffected.
 */

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchPinterestViaProxy(
  url: string
): Promise<{ title?: string; thumbnailUrl?: string }> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await timedFetch(proxyUrl, 5000);
    if (!res || !res.ok) return {};

    const data = await res.json();
    const html: string = data?.contents || "";
    if (!html || html.length < 200) return {};

    /* Extract og:image — handle both attribute orderings */
    const ogImageMatch =
      html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    const rawImageUrl = ogImageMatch?.[1];
    const thumbnailUrl =
      rawImageUrl && rawImageUrl.includes("pinimg.com")
        ? decodeHtmlEntities(rawImageUrl)
        : undefined;

    /* Extract og:title as a bonus */
    const ogTitleMatch =
      html.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1];
    const title = rawTitle ? decodeHtmlEntities(rawTitle).trim() : undefined;

    if (thumbnailUrl || title) {
      console.log("[Vexo] proxy scraped — title:", title, "thumb:", !!thumbnailUrl);
    }

    return { title, thumbnailUrl };
  } catch (err) {
    console.log("[Vexo] proxy scrape failed:", err);
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
 * Strategy:
 *   Round 1 — fire 3 CORS-safe sources + redirect resolution in parallel
 *   Round 2 — if pin.it resolved AND we still lack title/image, retry
 *   Fallback — title "Saved from Pinterest" is ALWAYS returned;
 *              VideoCard has a styled placeholder for missing thumbnails
 *
 * The entire function is wrapped in try/catch so it can never throw —
 * the caller in add.tsx always gets a usable VideoMetadata object.
 */

async function fetchPinterestMeta(url: string): Promise<VideoMetadata> {
  try {
    /* Fire all sources in parallel — proxy scrape runs alongside the rest */
    const [oembedRes, mlRes, noembedRes, proxyRes, resolvedUrl] = await Promise.all([
      fetchPinterestOembed(url).catch(() => ({})),
      fetchMicrolink(url).catch(() => ({})),
      fetchNoembed(url).catch(() => ({})),
      fetchPinterestViaProxy(url).catch(() => ({})),   /* HTML scrape via AllOrigins */
      resolvePinIt(url).catch(() => url),
    ]);

    let title =
      (oembedRes as any).title ||
      (proxyRes as any).title ||
      (mlRes as any).title ||
      (noembedRes as any).title ||
      (mlRes as any).description?.slice(0, 100) ||
      undefined;

    let thumbnailUrl =
      (proxyRes as any).thumbnailUrl ||          /* proxy is most likely to get real CDN img */
      (oembedRes as any).thumbnailUrl ||
      (noembedRes as any).thumbnailUrl ||
      (mlRes as any).imageUrl ||
      undefined;

    /* Round 2: if pin.it resolved to canonical URL and we still lack data, retry */
    const resolved = resolvedUrl as string;
    if (resolved !== url && (!title || !thumbnailUrl)) {
      const [oe2, ml2, proxy2] = await Promise.all([
        fetchPinterestOembed(resolved).catch(() => ({})),
        fetchMicrolink(resolved).catch(() => ({})),
        fetchPinterestViaProxy(resolved).catch(() => ({})),
      ]);
      if (!title) {
        title = (oe2 as any).title || (proxy2 as any).title || (ml2 as any).title || (ml2 as any).description?.slice(0, 100);
      }
      if (!thumbnailUrl) {
        thumbnailUrl = (proxy2 as any).thumbnailUrl || (oe2 as any).thumbnailUrl || (ml2 as any).imageUrl;
      }
    }

    console.log("[Vexo] fetchPinterestMeta result — title:", title, "thumb:", !!thumbnailUrl);

    return {
      title: title || "Saved from Pinterest",
      thumbnailUrl,
    };
  } catch (err) {
    console.log("[Vexo] fetchPinterestMeta threw:", err, "— using fallback");
    return { title: "Saved from Pinterest" };
  }
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
