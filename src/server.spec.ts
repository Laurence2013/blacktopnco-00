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
    const maxResults = parseInt(parsedUrl.searchParams.get('maxResults') || '24', 10);
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
    const id = parsedUrl.searchParams.get('id') || 'unknown';
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

  describe('GET /api/youtube/search', () => {
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

  describe('GET /api/youtube/videos', () => {
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
});
