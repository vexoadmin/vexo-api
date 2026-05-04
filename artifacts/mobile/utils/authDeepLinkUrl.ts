/**
 * OAuth callbacks often use a hash fragment (e.g. #access_token=...).
 * URL.searchParams and some parsers ignore the hash; map it to a query string for parsing.
 */
export function normalizeAuthHashToQueryForParse(incoming: string): string {
  if (incoming.includes("#access_token=")) {
    return incoming.replace("#", "?");
  }
  return incoming;
}

/** Parse Supabase OAuth access/refresh tokens from a vexo://auth URL (hash or query). */
export function extractOAuthTokensFromVexoAuthUrl(rawUrl: string): {
  accessToken?: string;
  refreshToken?: string;
} {
  const trimmed = rawUrl.trim();
  const normalized = normalizeAuthHashToQueryForParse(trimmed);
  try {
    const parsed = new URL(normalized);
    const accessToken = parsed.searchParams.get("access_token") ?? undefined;
    const refreshToken = parsed.searchParams.get("refresh_token") ?? undefined;
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  } catch {
    // fall through to hash parse
  }
  const hashIdx = trimmed.indexOf("#");
  if (hashIdx >= 0) {
    const sp = new URLSearchParams(trimmed.slice(hashIdx + 1));
    const accessToken = sp.get("access_token") ?? undefined;
    const refreshToken = sp.get("refresh_token") ?? undefined;
    return { accessToken, refreshToken };
  }
  return {};
}
