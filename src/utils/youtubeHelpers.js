export function parseYouTubeSource(url) {
  if (!url) {
    return {
      listId: '',
      videoId: '',
    };
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    const listId = parsed.searchParams.get('list') || '';
    let videoId = parsed.searchParams.get('v') || '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.replace('/', '');
    }

    if (!videoId && parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/')[2] || '';
    }

    return { listId, videoId };
  } catch {
    return {
      listId: '',
      videoId: '',
    };
  }
}

export function buildThumbnailUrl(videoId) {
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : '';
}
