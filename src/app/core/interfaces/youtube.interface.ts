export interface YouTubeVideo {
  id: { videoId: string } | string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}
