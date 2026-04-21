export type ParsedYouTubeSource = {
  rawUrl: string;
  videoId: string | null;
  playlistId: string | null;
};

export type YouTubeThumbnailQuality = "maxresdefault" | "sddefault" | "hqdefault";

function normalizeSource(rawUrl: string) {
  return rawUrl.trim();
}

function buildThumbnailProxyUrl(videoId: string, quality: YouTubeThumbnailQuality) {
  const params = new URLSearchParams({
    videoId,
    quality,
  });

  return `/api/youtube-thumbnail?${params.toString()}`;
}

function extractVideoIdFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
    return segments[1] ?? null;
  }

  if (segments[0] === "watch") {
    return null;
  }

  return segments[0] ?? null;
}

export function extractYouTubeVideoId(rawUrl: string) {
  const normalized = normalizeSource(rawUrl);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    const queryVideoId = url.searchParams.get("v");
    if (queryVideoId) {
      return queryVideoId;
    }

    return extractVideoIdFromPathname(url.pathname);
  } catch {
    return null;
  }
}

export function parseYouTubeSource(rawUrl: string): ParsedYouTubeSource {
  const normalized = normalizeSource(rawUrl);

  if (!normalized) {
    return {
      rawUrl: "",
      videoId: null,
      playlistId: null,
    };
  }

  try {
    const url = new URL(normalized);
    const videoId = extractYouTubeVideoId(normalized);
    const playlistId = url.searchParams.get("list");

    return {
      rawUrl: normalized,
      videoId,
      playlistId,
    };
  } catch {
    return {
      rawUrl: normalized,
      videoId: null,
      playlistId: null,
    };
  }
}

export function getYouTubeThumbnail(videoId: string | null) {
  if (!videoId) {
    return "";
  }

  return buildThumbnailProxyUrl(videoId, "hqdefault");
}

export function getYouTubeThumbnailCandidates(videoId: string | null): string[] {
  if (!videoId) {
    return [];
  }

  return (["maxresdefault", "sddefault", "hqdefault"] as YouTubeThumbnailQuality[]).map(
    (quality) => buildThumbnailProxyUrl(videoId, quality),
  );
}
