export type ParsedYouTubeSource = {
  rawUrl: string;
  videoId: string | null;
  playlistId: string | null;
};

export type YouTubeThumbnailQuality = "maxresdefault" | "sddefault" | "hqdefault";

function normalizeSource(rawUrl: string) {
  return rawUrl.trim();
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
    const isShort = url.hostname.includes("youtu.be");
    const videoId = isShort ? url.pathname.replace("/", "") : url.searchParams.get("v");
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

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeThumbnailCandidates(videoId: string | null): string[] {
  if (!videoId) {
    return [];
  }

  return ["maxresdefault", "sddefault", "hqdefault"].map(
    (quality) => `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`,
  );
}
