export interface VideoMetadata {
  thumbnailUrl?: string;
  title?: string;
}

/* ─── YouTube helpers (no CORS needed) ─────────────────── */

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

/* ─── Microlink — CORS-safe OG metadata for all platforms ─ */

interface MicrolinkResponse {
  status: "success" | "error" | "fail";
  data?: {
    title?: string | null;
    description?: string | null;
    image?: { url?: string | null } | null;
    logo?: { url?: string | null } | null;
  };
}

async function fetchMicrolinkMeta(url: string): Promise<{ title?: string; imageUrl?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return {};

    const json: MicrolinkResponse = await res.json();
    if (json.status !== "success" || !json.data) return {};

    const title = json.data.title ?? undefined;
    const imageUrl = json.data.image?.url ?? undefined;

    return {
      title: title || undefined,
      imageUrl: imageUrl || undefined,
    };
  } catch {
    return {};
  }
}

/* ─── Main export ───────────────────────────────────────── */

export async function fetchVideoMetadata(
  url: string,
  platform: "youtube" | "tiktok" | "instagram" | "facebook"
): Promise<VideoMetadata> {

  if (platform === "youtube") {
    /* YouTube: thumbnail is always available directly (no CORS).
       Use microlink for title — it's CORS-safe. */
    const videoId = extractYoutubeId(url);
    const thumbnailUrl = videoId ? getYoutubeThumbnail(videoId) : undefined;

    const { title } = await fetchMicrolinkMeta(url);

    return { thumbnailUrl, title };
  }

  /* TikTok, Instagram, Facebook — fully via microlink */
  const { title, imageUrl } = await fetchMicrolinkMeta(url);
  return { title, thumbnailUrl: imageUrl };
}
