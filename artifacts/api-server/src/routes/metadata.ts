import { Router, type IRouter } from "express";

type PlatformType =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "website";

type MetadataResponse = {
  resolverVersion: "metadata-resolver-v2";
  title: string;
  thumbnailUrl?: string;
  description?: string;
  url: string;
  fallbackImageUrl: string;
  hasRealPreviewImage: boolean;
  isFallback: boolean;
  platform: PlatformType;
  domain: string;
  sourceLabel: string;
};
type DebugLogger = {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  error?: (obj: Record<string, unknown>, msg?: string) => void;
};

const router: IRouter = Router();

const DEFAULT_TITLE = "Saved link";
const DEFAULT_FALLBACK_IMAGE = "https://www.google.com/s2/favicons?sz=256";
const FETCH_TIMEOUT_MS = 9000;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseUrl(raw: string): URL | null {
  try {
    const url = new URL(normalizeUrl(raw));
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function extractDomain(url: URL): string {
  return url.hostname.replace(/^www\./i, "");
}

function detectPlatform(domain: string): PlatformType {
  const lower = domain.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (
    lower === "tiktok.com" ||
    lower === "www.tiktok.com" ||
    lower === "vm.tiktok.com" ||
    lower === "vt.tiktok.com" ||
    lower.endsWith(".tiktok.com")
  ) {
    return "tiktok";
  }
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower === "fb.com") {
    return "facebook";
  }
  if (
    lower === "pin.it" ||
    lower.includes("pinterest.com") ||
    lower.endsWith(".pinterest.com") ||
    lower.includes(".pinterest.")
  ) {
    return "pinterest";
  }
  return "website";
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function youtubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function faviconForDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(domain)}`;
}

function screenshotFallback(url: string): string {
  return `https://image.thum.io/get/width/1200/noanimate/${encodeURIComponent(url)}`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function sanitizeTitle(title?: string): string | undefined {
  if (!title) return undefined;

  const cleaned = decodeHtmlEntities(title).replace(/\s+/g, " ").trim().slice(0, 180);
  if (!cleaned) return undefined;
  if (["facebook", "instagram", "tiktok"].includes(cleaned.toLowerCase())) return undefined;
  return cleaned;
}

function absoluteAssetUrl(pageUrl: URL, candidate?: string): string | undefined {
  if (!candidate) return undefined;
  const clean = decodeHtmlEntities(candidate).trim();
  if (!clean) return undefined;

  try {
    return new URL(clean, pageUrl).toString();
  } catch {
    return undefined;
  }
}

function extractMetaContent(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1];
}

function extractJsonLdMetadata(html: string): {
  title?: string;
  image?: string;
} {
  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptRegex.exec(html))) {
    const raw = scriptMatch[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as unknown;
      const queue = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of queue) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        const titleCandidate =
          (typeof record["headline"] === "string" && record["headline"]) ||
          (typeof record["name"] === "string" && record["name"]) ||
          undefined;

        const imageField = record["image"];
        let imageCandidate: string | undefined;
        if (typeof imageField === "string") {
          imageCandidate = imageField;
        } else if (Array.isArray(imageField)) {
          imageCandidate = imageField.find(
            (entry): entry is string => typeof entry === "string",
          );
        } else if (imageField && typeof imageField === "object") {
          const imgObj = imageField as Record<string, unknown>;
          if (typeof imgObj["url"] === "string") imageCandidate = imgObj["url"];
        }

        if (titleCandidate || imageCandidate) {
          return { title: titleCandidate, image: imageCandidate };
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return {};
}

function extractFavicon(html: string, pageUrl: URL): string | undefined {
  const iconPatterns = [
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i,
  ];

  for (const pattern of iconPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const absolute = absoluteAssetUrl(pageUrl, match[1]);
      if (absolute) return absolute;
    }
  }

  return undefined;
}

async function fetchHtml(url: string): Promise<{
  html?: string;
  finalUrl: string;
  statusCode?: number;
  contentType?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        accept: "text/html",
        "accept-language": "he,en-US,en;q=0.9",
      },
    });

    const finalUrl = res.url || url;
    if (!res.ok) {
      return {
        finalUrl,
        statusCode: res.status,
        contentType: res.headers.get("content-type") || "",
      };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        finalUrl,
        statusCode: res.status,
        contentType,
      };
    }

    const html = await res.text();
    return { html, finalUrl, statusCode: res.status, contentType };
  } catch {
    return { finalUrl: url };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchMicrolink(url: string): Promise<{
  called: boolean;
  requestUrl: string;
  httpStatus?: number;
  jsonKeys?: string[];
  dataTitle?: string;
  dataImageUrl?: string;
  dataError?: unknown;
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  resolvedUrl?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(
    url,
  )}&screenshot=false&meta=true`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });
    if (!res.ok) {
      return {
        called: true,
        requestUrl: endpoint,
        httpStatus: res.status,
      };
    }
    const json = (await res.json()) as any;
    const data = json?.data;
    const base = {
      called: true,
      requestUrl: endpoint,
      httpStatus: res.status,
      jsonKeys: json && typeof json === "object" ? Object.keys(json) : undefined,
      dataTitle: data?.title,
      dataImageUrl: data?.image?.url,
      dataError: json?.error || data?.error,
    };
    if (!data) return base;
    return {
      ...base,
      title: sanitizeTitle(data.title),
      thumbnailUrl: typeof data.image?.url === "string" ? data.image.url : undefined,
      description:
        typeof data.description === "string" ? decodeHtmlEntities(data.description) : undefined,
      resolvedUrl: typeof data.url === "string" ? data.url : undefined,
    };
  } catch {
    return {
      called: true,
      requestUrl: endpoint,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYoutubeOEmbed(url: string): Promise<{
  called: boolean;
  requestUrl: string;
  httpStatus?: number;
  title?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });
    if (!res.ok) {
      return {
        called: true,
        requestUrl: endpoint,
        httpStatus: res.status,
      };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return {
      called: true,
      requestUrl: endpoint,
      httpStatus: res.status,
      title: typeof json["title"] === "string" ? sanitizeTitle(json["title"]) : undefined,
    };
  } catch {
    return {
      called: true,
      requestUrl: endpoint,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTikTokOEmbed(url: string): Promise<{
  called: boolean;
  requestUrl: string;
  httpStatus?: number;
  title?: string;
  thumbnailUrl?: string;
  authorName?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });
    if (!res.ok) {
      return {
        called: true,
        requestUrl: endpoint,
        httpStatus: res.status,
      };
    }
    const json = (await res.json()) as any;
    return {
      called: true,
      requestUrl: endpoint,
      httpStatus: res.status,
      title: sanitizeTitle(json?.title),
      thumbnailUrl:
        typeof json?.thumbnail_url === "string" ? json.thumbnail_url : undefined,
      authorName:
        typeof json?.author_name === "string" ? json.author_name : undefined,
    };
  } catch {
    return {
      called: true,
      requestUrl: endpoint,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveFinalUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
    });
    return res.url || url;
  } catch {
    return url;
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackTitle(platform: PlatformType, domain: string): string {
  switch (platform) {
    case "youtube":
      return "Saved YouTube video";
    case "tiktok":
      return "Saved TikTok video";
    case "instagram":
      return "Saved Instagram post";
    case "facebook":
      return "Saved Facebook post";
    case "pinterest":
      return "Pinterest saved idea";
    default:
      return domain ? `Saved from ${domain}` : DEFAULT_TITLE;
  }
}

function sourceLabelForPlatform(platform: PlatformType, domain: string): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "pinterest":
      return "Pinterest";
    default:
      return domain || "Website";
  }
}

function buildStableResponse(args: {
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  url: string;
  fallbackImageUrl?: string;
  hasRealPreviewImage?: boolean;
  isFallback?: boolean;
  platform: PlatformType;
  domain: string;
}): MetadataResponse {
  const stableFallback = args.fallbackImageUrl || faviconForDomain(args.domain) || DEFAULT_FALLBACK_IMAGE;
  const hasRealPreviewImage = Boolean(args.hasRealPreviewImage && args.thumbnailUrl);
  const isFallback = args.isFallback ?? !hasRealPreviewImage;
  return {
    resolverVersion: "metadata-resolver-v2",
    title: sanitizeTitle(args.title) || fallbackTitle(args.platform, args.domain),
    thumbnailUrl: hasRealPreviewImage ? args.thumbnailUrl : undefined,
    description: args.description,
    url: args.url,
    fallbackImageUrl: stableFallback,
    hasRealPreviewImage,
    isFallback,
    platform: args.platform,
    domain: args.domain,
    sourceLabel: sourceLabelForPlatform(args.platform, args.domain),
  };
}

export async function resolveMetadata(
  rawUrl: string,
  logger?: DebugLogger,
): Promise<{ payload: MetadataResponse; statusCode: number; sourceUsed: "microlink" | "html" | "fallback"; fallbackReason?: string }> {
  const parsed = parseUrl(rawUrl);
  logger?.info({ inputUrl: rawUrl }, "REQUEST_STARTED");
  if (!parsed) {
    const payload = buildStableResponse({
      platform: "website",
      domain: "link",
      title: DEFAULT_TITLE,
      url: "https://link",
      fallbackImageUrl: DEFAULT_FALLBACK_IMAGE,
      hasRealPreviewImage: false,
      isFallback: true,
    });
    const fallbackReason = "invalid_url";
    logger?.info({ sourceUsed: "fallback", fallbackReason, finalResponse: payload }, "REQUEST_FINISHED");
    return { payload, statusCode: 400, sourceUsed: "fallback", fallbackReason };
  }

  const inputUrl = parsed.toString();
  const domain = extractDomain(parsed);
  const platform = detectPlatform(domain);
  const inputYoutubeId = platform === "youtube" ? extractYoutubeId(inputUrl) : null;
  const inputYoutubeThumbnail = inputYoutubeId ? youtubeThumbnail(inputYoutubeId) : undefined;
  logger?.info({ normalizedUrl: inputUrl, platformDetected: platform }, "REQUEST_NORMALIZED");

  const normalizedInputUrl =
    (platform === "pinterest" && domain.toLowerCase() === "pin.it") ||
    (platform === "tiktok" &&
      (domain.toLowerCase() === "vm.tiktok.com" ||
        domain.toLowerCase() === "vt.tiktok.com"))
      ? await resolveFinalUrl(inputUrl)
      : inputUrl;
  logger?.info({ normalizedUrl: normalizedInputUrl }, "REQUEST_RESOLVED_URL");
  logger?.info(
    {
      inputUrl: rawUrl,
      detectedPlatform: platform,
    },
    "METADATA_INPUT_PLATFORM",
  );

  let youtubeOEmbedTitle: string | undefined;
  if (platform === "youtube") {
    const youtubeOEmbed = await fetchYoutubeOEmbed(normalizedInputUrl);
    youtubeOEmbedTitle = youtubeOEmbed.title;
    logger?.info(
      {
        oEmbedCalled: youtubeOEmbed.called,
        oEmbedRequestUrl: youtubeOEmbed.requestUrl,
        oEmbedStatus: youtubeOEmbed.httpStatus,
        oEmbedTitle: youtubeOEmbed.title,
      },
      "YOUTUBE_OEMBED_DEBUG",
    );
  }

  if (platform === "tiktok") {
    logger?.info(
      {
        tiktokDetected: true,
        finalResolvedTikTokUrl: normalizedInputUrl,
      },
      "TIKTOK_DETECTED",
    );
    const oEmbed = await fetchTikTokOEmbed(normalizedInputUrl);
    logger?.info(
      {
        oEmbedCalled: oEmbed.called,
        oEmbedRequestUrl: oEmbed.requestUrl,
        oEmbedStatus: oEmbed.httpStatus,
        oEmbedTitle: oEmbed.title,
        oEmbedThumbnailUrl: oEmbed.thumbnailUrl,
      },
      "TIKTOK_OEMBED_DEBUG",
    );
    if (oEmbed.title || oEmbed.thumbnailUrl) {
      const payload = buildStableResponse({
        title: oEmbed.title || "TikTok video",
        thumbnailUrl: oEmbed.thumbnailUrl,
        description: oEmbed.authorName ? `@${oEmbed.authorName}` : undefined,
        url: normalizedInputUrl,
        fallbackImageUrl: faviconForDomain(domain),
        hasRealPreviewImage: Boolean(oEmbed.thumbnailUrl),
        isFallback: !oEmbed.thumbnailUrl,
        platform: "tiktok",
        domain,
      });
      logger?.info(
        {
          sourceUsed: "tiktok-oembed",
          title: payload.title,
          image: payload.thumbnailUrl || payload.fallbackImageUrl,
          finalResponse: payload,
        },
        "REQUEST_FINISHED",
      );
      return { payload, statusCode: 200, sourceUsed: "microlink" };
    }
  }

  const microlink = await fetchMicrolink(normalizedInputUrl);
  logger?.info(
    {
      microlinkCalled: microlink.called,
      microlinkRequestUrl: microlink.requestUrl,
      microlinkHttpStatus: microlink.httpStatus,
      microlinkRawJsonKeys: microlink.jsonKeys,
      microlinkDataTitle: microlink.dataTitle,
      microlinkDataImageUrl: microlink.dataImageUrl,
      microlinkDataError: microlink.dataError,
    },
    "MICROLINK_DEBUG",
  );

  const microlinkResolved = microlink.resolvedUrl || normalizedInputUrl;
  const fetched = await fetchHtml(microlinkResolved);
  logger?.info(
    {
      htmlFetchCalled: true,
      htmlFetchStatus: fetched.statusCode,
      htmlContentType: fetched.contentType,
      htmlLength: fetched.html?.length ?? 0,
      htmlFirst300Chars: fetched.html ? fetched.html.slice(0, 300) : "",
    },
    "HTML_FETCH_DEBUG",
  );

  const finalParsed = parseUrl(microlinkResolved) || parseUrl(fetched.finalUrl) || parsed;
  const finalDomain = extractDomain(finalParsed);
  const finalPlatform = detectPlatform(finalDomain);

  if (microlink.title || microlink.thumbnailUrl) {
    const microlinkYoutubeId =
      finalPlatform === "youtube"
        ? extractYoutubeId(microlinkResolved) || inputYoutubeId
        : null;
    const microlinkOrYoutubeThumb =
      microlink.thumbnailUrl ||
      (microlinkYoutubeId ? youtubeThumbnail(microlinkYoutubeId) : undefined);
    const payload = buildStableResponse({
      title:
        microlink.title ||
        youtubeOEmbedTitle ||
        (finalPlatform === "youtube" ? "YouTube video" : fallbackTitle(finalPlatform, finalDomain)),
      thumbnailUrl: microlinkOrYoutubeThumb,
      description: microlink.description,
      url: microlinkResolved,
      fallbackImageUrl: faviconForDomain(finalDomain),
      hasRealPreviewImage: Boolean(microlinkOrYoutubeThumb),
      isFallback: !microlinkOrYoutubeThumb,
      platform: finalPlatform,
      domain: finalDomain,
    });
    logger?.info(
      {
        extractedTitle: microlink.title || youtubeOEmbedTitle,
        extractedImageCandidate: microlink.thumbnailUrl || inputYoutubeThumbnail,
        finalImageUrl: payload.thumbnailUrl || payload.fallbackImageUrl,
        isFallback: payload.isFallback,
        sourceUsed: "microlink",
        title: payload.title,
        image: payload.thumbnailUrl || payload.fallbackImageUrl,
        finalResponse: payload,
      },
      "REQUEST_FINISHED",
    );
    return { payload, statusCode: 200, sourceUsed: "microlink" };
  }

  if (!fetched.html) {
    const youtubeId =
      finalPlatform === "youtube" ? extractYoutubeId(microlinkResolved) : null;
    const ytThumb = youtubeId ? youtubeThumbnail(youtubeId) : undefined;
    const fallbackReason = "html_missing_after_microlink_empty";
    const payload = buildStableResponse({
      platform: finalPlatform,
      domain: finalDomain,
      title:
        finalPlatform === "tiktok"
          ? "TikTok video"
          : fallbackTitle(finalPlatform, finalDomain),
      url: fetched.finalUrl || microlinkResolved,
      thumbnailUrl: ytThumb,
      fallbackImageUrl: ytThumb || faviconForDomain(finalDomain),
      hasRealPreviewImage: Boolean(ytThumb),
      isFallback: !ytThumb,
    });
    logger?.info(
      {
        sourceUsed: "fallback",
        fallbackReason,
        title: payload.title,
        image: payload.thumbnailUrl || payload.fallbackImageUrl,
        finalResponse: payload,
      },
      "REQUEST_FINISHED",
    );
    return { payload, statusCode: 200, sourceUsed: "fallback", fallbackReason };
  }

  const ogTitle = extractMetaContent(fetched.html, "og:title");
  const ogImage =
    extractMetaContent(fetched.html, "og:image:secure_url") ||
    extractMetaContent(fetched.html, "og:image");
  const ogDescription = extractMetaContent(fetched.html, "og:description");
  const twitterTitle = extractMetaContent(fetched.html, "twitter:title");
  const twitterImage =
    extractMetaContent(fetched.html, "twitter:image") ||
    extractMetaContent(fetched.html, "twitter:image:src");
  const itempropImage = extractMetaContent(fetched.html, "image");
  const imageSrc =
    fetched.html.match(
      /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    )?.[1] ||
    fetched.html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*image_src[^"']*["'][^>]*>/i,
    )?.[1];
  const titleTag = extractTitleTag(fetched.html);
  const jsonLd = extractJsonLdMetadata(fetched.html);

  logger?.info(
    {
      extractedOgTitle: ogTitle,
      extractedTwitterTitle: twitterTitle,
      extractedJsonLdTitle: jsonLd.title,
      extractedTitleTag: titleTag,
      extractedOgImage: ogImage,
      extractedTwitterImage: twitterImage,
      extractedJsonLdImage: jsonLd.image,
      extractedItempropImage: itempropImage,
      extractedImageSrc: imageSrc,
    },
    "HTML_EXTRACTED_FIELDS",
  );

  const title =
    youtubeOEmbedTitle ||
    sanitizeTitle(ogTitle) ||
    sanitizeTitle(twitterTitle) ||
    sanitizeTitle(jsonLd.title) ||
    sanitizeTitle(titleTag) ||
    (finalPlatform === "youtube" ? "YouTube video" : undefined) ||
    (finalPlatform === "tiktok" ? "TikTok video" : undefined) ||
    fallbackTitle(finalPlatform, finalDomain);

  const realPreviewImage =
    absoluteAssetUrl(finalParsed, ogImage) ||
    absoluteAssetUrl(finalParsed, twitterImage) ||
    absoluteAssetUrl(finalParsed, jsonLd.image) ||
    absoluteAssetUrl(finalParsed, itempropImage) ||
    absoluteAssetUrl(finalParsed, imageSrc) ||
    (() => {
      if (finalPlatform !== "youtube") return undefined;
      const id = extractYoutubeId(fetched.finalUrl) || inputYoutubeId;
      return id ? youtubeThumbnail(id) : undefined;
    })();
  const icon = extractFavicon(fetched.html, finalParsed);
  const fallbackImageUrl =
    icon || faviconForDomain(finalDomain) || screenshotFallback(fetched.finalUrl);

  const payload = buildStableResponse({
    title,
    thumbnailUrl: realPreviewImage,
    description: sanitizeTitle(ogDescription),
    url: fetched.finalUrl,
    fallbackImageUrl,
    hasRealPreviewImage: Boolean(realPreviewImage),
    isFallback: !realPreviewImage,
    platform: finalPlatform,
    domain: finalDomain,
  });

  const sourceUsed: "html" | "fallback" = realPreviewImage || title ? "html" : "fallback";
  const fallbackReason = sourceUsed === "fallback" ? "html_extraction_empty" : undefined;
  logger?.info(
    {
      extractedTitle: title,
      extractedImageCandidate:
        ogImage || twitterImage || jsonLd.image || itempropImage || imageSrc || inputYoutubeThumbnail,
      finalImageUrl: payload.thumbnailUrl || payload.fallbackImageUrl,
      isFallback: payload.isFallback,
      sourceUsed,
      fallbackReason,
      title: payload.title,
      image: payload.thumbnailUrl || payload.fallbackImageUrl,
      finalResponse: payload,
    },
    "REQUEST_FINISHED",
  );
  return { payload, statusCode: 200, sourceUsed, fallbackReason };
}

router.get("/metadata", async (req, res) => {
  try {
    req.log?.info(
      { path: "/api/metadata", resolverVersion: "metadata-resolver-v2" },
      "API SERVER METADATA ROUTE HIT - metadata-resolver-v2",
    );
    const rawUrl = typeof req.query["url"] === "string" ? req.query["url"] : "";
    const { payload, statusCode } = await resolveMetadata(rawUrl, req.log as DebugLogger | undefined);
    res.status(statusCode).json(payload);
  } catch (error) {
    req.log?.error?.({ error }, "Metadata resolver unhandled error");
    const payload = buildStableResponse({
      platform: "website",
      domain: "link",
      title: DEFAULT_TITLE,
      url: "https://link",
      fallbackImageUrl: DEFAULT_FALLBACK_IMAGE,
      hasRealPreviewImage: false,
      isFallback: true,
    });
    res.json(payload);
  }
});

export default router;
