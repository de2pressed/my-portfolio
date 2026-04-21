import { NextResponse } from "next/server";

import type { YouTubeThumbnailQuality } from "@/lib/youtube";

const VALID_QUALITIES = new Set<YouTubeThumbnailQuality>(["maxresdefault", "sddefault", "hqdefault"]);
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function normalizeVideoId(value: string | null) {
  if (!value || !YOUTUBE_VIDEO_ID_PATTERN.test(value)) {
    return null;
  }

  return value;
}

function normalizeQuality(value: string | null) {
  if (!value) {
    return "hqdefault";
  }

  return VALID_QUALITIES.has(value as YouTubeThumbnailQuality) ? (value as YouTubeThumbnailQuality) : "hqdefault";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoId = normalizeVideoId(url.searchParams.get("videoId"));
  const quality = normalizeQuality(url.searchParams.get("quality"));

  if (!videoId) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`https://i.ytimg.com/vi/${videoId}/${quality}.jpg`, {
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.warn("Thumbnail proxy request failed.", error);
    return NextResponse.json({ error: "Thumbnail unavailable" }, { status: 502 });
  }
}
