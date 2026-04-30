import { nextQaSequence, qaLog } from "@/utils/qaDebugLog";

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
  const sequence = nextQaSequence("SHARE");
  qaLog("SHARE", "+native-intent payload received", { sequence, rawPath });
  console.log("[SHARE DEBUG] +native-intent payload received", { rawPath });
  console.log("[share] native intent input", rawPath);
  const decoded = decodePossiblyEncoded(rawPath).trim();
  console.log("[SHARE DEBUG] +native-intent raw shared text/url", { decoded });
  const directFromLooseQuery = (() => {
    const match = decoded.match(/(?:[?&#]|^)(?:url|text)=([^&#]+)/i);
    if (!match?.[1]) return undefined;
    const normalized = decodePossiblyEncoded(match[1]).trim();
    return extractFirstHttpUrl(normalized) || normalized;
  })();
  if (directFromLooseQuery) {
    const mapped = `/add?url=${encodeURIComponent(directFromLooseQuery)}`;
    qaLog("SHARE", "+native-intent extracted URL", {
      sequence,
      url: directFromLooseQuery,
    });
    qaLog("SHARE", "+native-intent navigating to /add", { sequence, mappedPath: mapped });
    console.log("[SHARE DEBUG] +native-intent extracted URL", directFromLooseQuery);
    console.log("[SHARE DEBUG] +native-intent navigating to /add", {
      mappedPath: mapped,
    });
    console.log("[share] extracted url", directFromLooseQuery);
    console.log("[share] mapped path", mapped);
    return mapped;
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
    const mapped = `/add?url=${encodeURIComponent(directFromQuery)}`;
    qaLog("SHARE", "+native-intent extracted URL", { sequence, url: directFromQuery });
    qaLog("SHARE", "+native-intent navigating to /add", { sequence, mappedPath: mapped });
    console.log("[SHARE DEBUG] +native-intent extracted URL", directFromQuery);
    console.log("[SHARE DEBUG] +native-intent navigating to /add", {
      mappedPath: mapped,
    });
    console.log("[share] extracted url", directFromQuery);
    console.log("[share] mapped path", mapped);
    return mapped;
  }
  const directUrl = extractFirstHttpUrl(decoded);
  if (directUrl) {
    const mapped = `/add?url=${encodeURIComponent(directUrl)}`;
    qaLog("SHARE", "+native-intent extracted URL", { sequence, url: directUrl });
    qaLog("SHARE", "+native-intent navigating to /add", { sequence, mappedPath: mapped });
    console.log("[SHARE DEBUG] +native-intent extracted URL", directUrl);
    console.log("[SHARE DEBUG] +native-intent navigating to /add", {
      mappedPath: mapped,
    });
    console.log("[share] extracted url", directUrl);
    console.log("[share] mapped path", mapped);
    return mapped;
  }
  console.log("[SHARE DEBUG] +native-intent navigation skipped: no URL extracted", {
    rawPath,
  });
  qaLog("SHARE", "+native-intent navigation skipped", {
    sequence,
    reason: "no URL extracted",
  });
  console.log("[share] mapped path", rawPath);
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
  qaLog("SHARE", "+native-intent redirectSystemPath called", { hasPath: !!path });
  console.log("[SHARE DEBUG] +native-intent redirectSystemPath called", {
    hasPath: !!path,
  });
  if (!path) {
    console.log("[SHARE DEBUG] +native-intent navigation skipped: empty path");
    return path;
  }
  return mapIncomingToAddPath(path);
}
