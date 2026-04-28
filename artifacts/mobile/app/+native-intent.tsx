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

function mapIncomingToAddPath(rawPath: string): string {
  const decoded = decodePossiblyEncoded(rawPath).trim();
  const directFromLooseQuery = (() => {
    const match = decoded.match(/(?:[?&#]|^)(?:url|text)=([^&#]+)/i);
    if (!match?.[1]) return undefined;
    const normalized = decodePossiblyEncoded(match[1]).trim();
    return extractFirstHttpUrl(normalized) || normalized;
  })();
  if (directFromLooseQuery) {
    return `/add?url=${encodeURIComponent(directFromLooseQuery)}`;
  }
  const directFromQuery = (() => {
    try {
      const parsed = new URL(decoded.startsWith("vexo://") ? decoded : `vexo://${decoded.replace(/^\//, "")}`);
      const queryUrl = parsed.searchParams.get("url") || parsed.searchParams.get("text");
      if (!queryUrl) return undefined;
      const normalized = decodePossiblyEncoded(queryUrl).trim();
      return extractFirstHttpUrl(normalized) || normalized;
    } catch {
      return undefined;
    }
  })();
  if (directFromQuery) {
    return `/add?url=${encodeURIComponent(directFromQuery)}`;
  }
  const directUrl = extractFirstHttpUrl(decoded);
  if (directUrl) {
    return `/add?url=${encodeURIComponent(directUrl)}`;
  }
  return rawPath;
}

/**
 * Android beta best-effort share handling:
 * - We support deep links and system intents that surface a path/URL to JS.
 * - Native Android SEND extras (EXTRA_TEXT) are not guaranteed to be exposed in
 *   Expo managed runtime without a dedicated native share-intent module/plugin.
 * - iOS native Share Extension is intentionally out of scope for now.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (!path) return path;
  return mapIncomingToAddPath(path);
}
