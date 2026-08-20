const supportedSpotifyTypes = new Set(["track", "playlist", "album", "episode", "show"]);

export function getSpotifyEmbedUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.hostname !== "open.spotify.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    const typeIndex = segments.findIndex((segment) => supportedSpotifyTypes.has(segment));
    const type = typeIndex >= 0 ? segments[typeIndex] : null;
    const id = typeIndex >= 0 ? segments[typeIndex + 1] : null;
    if (!type || !id) return null;
    return `https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}`;
  } catch {
    return null;
  }
}

export function isSpotifyUrl(value: string) {
  return !value || Boolean(getSpotifyEmbedUrl(value));
}