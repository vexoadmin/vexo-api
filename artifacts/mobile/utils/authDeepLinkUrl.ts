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
