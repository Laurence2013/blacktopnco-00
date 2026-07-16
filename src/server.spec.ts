import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { app } from './server';
import type { Server } from 'http';

// Mock @angular/ssr/node before importing ./server to prevent manifest errors
vi.mock('@angular/ssr/node', () => {
  return {
    AngularNodeAppEngine: class {
      handle = vi.fn();
    },
    createNodeRequestHandler: vi.fn(),
    isMainModule: () => false,
    writeResponseToNodeResponse: vi.fn(),
  };
});

// Setup mock API key for testing before server imports/initializes fully
process.env['YOUTUBE_API_KEY'] = 'test-youtube-api-key';

// Stub global fetch to mock third-party YouTube API calls while preserving local loopback HTTP calls
const originalFetch = globalThis.fetch;
vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlString = input.toString();
  
  // Forward local Express requests to the actual server
  if (urlString.startsWith('http://localhost') || urlString.startsWith('http://127.0.0.1')) {
    return originalFetch(input, init);
  }

  // Mock YouTube Search endpoint response
  if (urlString.includes('youtube/v3/search')) {
    const parsedUrl = new URL(urlString);
    const q = parsedUrl.searchParams.get('q');
    
    // Simulate YouTube API errors based on query trigger words
    if (q === 'trigger-400-error') {
      return new Response('Bad Request details from YouTube API', { status: 400 });
    }
    if (q === 'trigger-403-error') {
      return new Response('Quota exceeded or forbidden request from YouTube API', { status: 403 });
    }

    // Simulate empty search query constraint
    if (!q || !q.trim()) {
      return new Response(
        JSON.stringify({
          kind: 'youtube#searchListResponse',
          items: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const videoDuration = parsedUrl.searchParams.get('videoDuration');
    const videoEmbeddable = parsedUrl.searchParams.get('videoEmbeddable');

    // Handle parameter propagation test trigger
    if (q === 'test-propagation') {
      return new Response(
        JSON.stringify({
          kind: 'youtube#searchListResponse',
          items: [],
          _testMetadata: {
            videoDuration,
            videoEmbeddable
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle special characters and emoji query test trigger
    if (q === 'study & chill 🎧') {
      return new Response(
        JSON.stringify({
          kind: 'youtube#searchListResponse',
          items: [
            {
              id: { videoId: 'emoji-video-id' },
              snippet: {
                title: 'Study & Chill Music 🎧',
                description: 'Special character test',
                publishedAt: new Date().toISOString(),
                thumbnails: {
                  default: { url: 'https://i.ytimg.com/mock.jpg' },
                  medium: { url: 'https://i.ytimg.com/mock.jpg' },
                  high: { url: 'https://i.ytimg.com/mock.jpg' }
                },
                channelTitle: 'Special Channel'
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxResults = parseInt(parsedUrl.searchParams.get('maxResults') || '24', 10);
    
    // Simulate YouTube API validation rules (maxResults range 1-50)
    if (maxResults < 1 || maxResults > 50) {
      return new Response('YouTube API error: maxResults must be between 1 and 50', { status: 400 });
    }

    const items = Array.from({ length: maxResults }, (_, i) => ({
      id: { videoId: `video-id-${i}` },
      snippet: {
        title: `Mocked Lofi Walking Music ${i}`,
        description: `Chill sounds description ${i}`,
        publishedAt: new Date().toISOString(),
        thumbnails: {
          default: { url: `https://i.ytimg.com/mock-${i}.jpg` },
          medium: { url: `https://i.ytimg.com/mock-${i}-med.jpg` },
          high: { url: `https://i.ytimg.com/mock-${i}-high.jpg` }
        },
        channelTitle: `Mocked Channel ${i}`
      }
    }));

    return new Response(
      JSON.stringify({
        kind: 'youtube#searchListResponse',
        items
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Mock YouTube Video details endpoint response
  if (urlString.includes('youtube/v3/videos')) {
    const parsedUrl = new URL(urlString);
    const id = parsedUrl.searchParams.get('id');

    // Simulate YouTube API error for missing/invalid video details ID
    if (!id || id === 'undefined' || id === 'null') {
      return new Response('YouTube API error: parameter id is required', { status: 400 });
    }

    return new Response(
      JSON.stringify({
        kind: 'youtube#videoListResponse',
        items: [
          {
            id,
            snippet: {
              title: 'Mocked Lofi Video',
              publishedAt: new Date().toISOString()
            }
          }
        ]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ error: 'Mock not configured for URL' }), { status: 404 });
});
describe('Express Server API Proxy Integration (Happy Path Functional Tests)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(() => {
    // Start the Express app on a random free port for test isolation
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    // Gracefully shut down the server after tests complete
    server.close();
  });
  describe('GET /api/youtube/search (Happy Path)', () => {
    it('should return 200 OK for valid request parameters', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi`);
      expect(res.status).toBe(200);
    });

    it('should return the exact expected payload structure and datatypes', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=2`);
      const data = await res.json();

      expect(data).toHaveProperty('kind');
      expect(data).toHaveProperty('items');
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBe(2);

      const firstItem = data.items[0];

      // Verify "id" structure
      expect(firstItem).toHaveProperty('id');
      expect(firstItem.id).toHaveProperty('videoId');
      expect(typeof firstItem.id.videoId).toBe('string');

      // Verify "snippet" structure
      expect(firstItem).toHaveProperty('snippet');
      expect(firstItem.snippet).toHaveProperty('title');
      expect(typeof firstItem.snippet.title).toBe('string');

      // Verify "publishedAt" is a valid ISO 8601 timestamp format
      expect(firstItem.snippet).toHaveProperty('publishedAt');
      const publishedAt = firstItem.snippet.publishedAt;
      const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      expect(publishedAt).toMatch(isoTimestampRegex);
    });

    it('should adjust response length based on maxResults query parameter', async () => {
      // Test requesting 5 results
      const res5 = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=5`);
      const data5 = await res5.json();
      expect(data5.items.length).toBe(5);

      // Test requesting 50 results
      const res50 = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=50`);
      const data50 = await res50.json();
      expect(data50.items.length).toBe(50);
    });
  });
  describe('GET /api/youtube/videos (Happy Path)', () => {
    it('should return 200 OK and valid detailed payload', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/videos?id=sF80I-TQiW0`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('kind', 'youtube#videoListResponse');
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items[0]).toHaveProperty('id', 'sF80I-TQiW0');
      
      const publishedAt = data.items[0].snippet.publishedAt;
      const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      expect(publishedAt).toMatch(isoTimestampRegex);
    });
  });
  describe('Sad Paths & Error Handling', () => {
    it('should return 500 error when YouTube API key is missing or placeholder', async () => {
      const originalKey = process.env['YOUTUBE_API_KEY'];
      
      // Temporarily remove API key from process env
      delete process.env['YOUTUBE_API_KEY'];

      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi`);
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('YouTube API Key is not configured on the server');

      // Restore key
      process.env['YOUTUBE_API_KEY'] = originalKey;
    });

    it('should forward 400 Bad Request error from YouTube API', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=trigger-400-error`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty('error', 'Bad Request details from YouTube API');
    });

    it('should forward 403 Quota Exceeded error from YouTube API', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=trigger-403-error`);
      expect(res.status).toBe(403);

      const data = await res.json();
      expect(data).toHaveProperty('error', 'Quota exceeded or forbidden request from YouTube API');
    });

    it('should return 400 when video details request is missing the id parameter', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/videos`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty('error', 'YouTube API error: parameter id is required');
    });
  });
  describe('Boundary Value Testing', () => {
    it('should return 400 Bad Request when maxResults is less than 1 (0)', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=0`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('maxResults must be between 1 and 50');
    });

    it('should return 400 Bad Request when maxResults is greater than 50 (51)', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=51`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('maxResults must be between 1 and 50');
    });

    it('should return 200 OK with empty items list when query is only whitespace', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=%20%20%20`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('kind', 'youtube#searchListResponse');
      expect(data).toHaveProperty('items');
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBe(0);
    });
  });

  describe('Optional Parameters & Special Characters Propagation', () => {
    it('should propagate optional videoDuration and videoEmbeddable parameters correctly', async () => {
      const res = await fetch(
        `${baseUrl}/api/youtube/search?q=test-propagation&videoDuration=long&videoEmbeddable=true`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('_testMetadata');
      expect(data._testMetadata).toHaveProperty('videoDuration', 'long');
      expect(data._testMetadata).toHaveProperty('videoEmbeddable', 'true');
    });

    it('should correctly handle special characters, ampersands, and emojis using URL encoding', async () => {
      const encodedQuery = encodeURIComponent('study & chill 🎧');
      const res = await fetch(`${baseUrl}/api/youtube/search?q=${encodedQuery}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.items.length).toBe(1);
      expect(data.items[0].id.videoId).toBe('emoji-video-id');
      expect(data.items[0].snippet.title).toBe('Study & Chill Music 🎧');
    });
  });

  describe('Security & Headers Validation', () => {
    it('should never leak the YOUTUBE_API_KEY in the response headers or body payload', async () => {
      const apiKey = process.env['YOUTUBE_API_KEY'] || 'test-youtube-api-key';
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi`);
      expect(res.status).toBe(200);

      // Verify no response headers contain the API key
      res.headers.forEach((value, key) => {
        expect(key.toLowerCase()).not.toContain(apiKey.toLowerCase());
        expect(value.toLowerCase()).not.toContain(apiKey.toLowerCase());
      });

      // Verify the response body does not contain the API key
      const bodyText = await res.text();
      expect(bodyText).not.toContain(apiKey);
    });

    it('should return correct content-type header indicating application/json format', async () => {
      const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi`);
      expect(res.status).toBe(200);

      const contentType = res.headers.get('content-type');
      expect(contentType).not.toBeNull();
      expect(contentType).toContain('application/json');
    });
  });
});
