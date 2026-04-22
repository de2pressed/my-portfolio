/**
 * YouTube IFrame API loader and player initialization.
 *
 * - Loads the API script exactly once (promise-guarded singleton).
 * - Creates a YT.Player instance with correct origin parameter.
 * - When a playlistId is present, videoId is omitted from playerVars
 *   so the playlist loads from its first entry (fixes RD* radio mixes).
 */

type ExtendedPlayer = YT.Player & {
  getVideoData: () => { title: string; video_id: string };
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  getVideoUrl: () => string;
  isMuted: () => boolean;
  getVolume: () => number;
  playVideoAt: (index: number) => void;
  setShuffle: (shufflePlaylist: boolean) => void;
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    __youtubeApiReadyPromise__?: Promise<typeof YT>;
  }
}

export type { ExtendedPlayer };

export type YouTubeSource = {
  videoId: string | null;
  playlistId: string | null;
  rawUrl: string;
};

export type PlayerEventHandlers = {
  onReady: (event: YT.PlayerEvent) => void;
  onStateChange: (event: YT.OnStateChangeEvent) => void;
  onError: (event: YT.OnErrorEvent) => void;
};

function loadYouTubeApi(): Promise<typeof YT> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__youtubeApiReadyPromise__) {
    return window.__youtubeApiReadyPromise__;
  }

  window.__youtubeApiReadyPromise__ = new Promise<typeof YT>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);

    if (typeof previousReady === "function") {
      const chainedReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady();
        chainedReady?.();
      };
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return window.__youtubeApiReadyPromise__;
}

export type CreatePlayerOptions = {
  hostElement: HTMLElement;
  source: YouTubeSource;
  handlers: PlayerEventHandlers;
};

export async function createYouTubePlayer(options: CreatePlayerOptions): Promise<ExtendedPlayer> {
  const api = await loadYouTubeApi();
  const { hostElement, source, handlers } = options;
  const origin = window.location.origin.replace(/\/$/, "");

  const playerVars: YT.PlayerVars = {
    enablejsapi: 1,
    origin,
    autoplay: 0,
    controls: 0,
    disablekb: 1,
    fs: 0,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    iv_load_policy: 3,
  };

  const playerOptions: YT.PlayerOptions = {
    height: "1",
    width: "1",
    playerVars,
    events: {
      onReady: handlers.onReady,
      onStateChange: handlers.onStateChange,
      onError: handlers.onError,
    },
  };

  if (source.playlistId) {
    playerVars.list = source.playlistId;
    playerVars.listType = "playlist";
  } else if (source.videoId) {
    playerOptions.videoId = source.videoId;
  }

  const player = new api.Player(hostElement, playerOptions) as ExtendedPlayer;

  return player;
}
