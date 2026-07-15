import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

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

import { app } from './server';
import type { Server } from 'http';

describe('Express Server API Proxy Integration', () => {
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

  it('should respond to YouTube search requests', async () => {
    const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi&maxResults=1`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('kind');
    expect(data).toHaveProperty('items');
    expect(data.items).toBeInstanceOf(Array);
  });

  it('should respond to YouTube video details requests', async () => {
    const res = await fetch(`${baseUrl}/api/youtube/videos?id=sF80I-TQiW0`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('kind');
    expect(data).toHaveProperty('items');
  });
});
