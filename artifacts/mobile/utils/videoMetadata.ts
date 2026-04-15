export interface VideoMetadata {
  thumbnailUrl?: string;
  title?: string;
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

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

export async function fetchVideoMetadata(
  url: string,
  platform: "youtube" | "tiktok" | "instagram"
): Promise<VideoMetadata> {
  if (platform === "youtube") {
    const videoId = extractYoutubeId(url);
    if (!videoId) return {};

    const thumbnailUrl = getYoutubeThumbnail(videoId);

    let title: string | undefined;
    try {
      const res = await safeFetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (res && res.ok) {
        const data = await res.json();
        title = data.title as string | undefined;
      }
    } catch {}

    return { thumbnailUrl, title };
  }

  if (platform === "tiktok") {
    try {
      const res = await safeFetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (res && res.ok) {
        const data = await res.json();
        return {
          thumbnailUrl: data.thumbnail_url as string | undefined,
          title: data.title as string | undefined,
        };
      }
    } catch {}
    return {};
  }

  return {};
}
