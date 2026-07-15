import 'dotenv/config';
import {AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

export const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * YouTube API Proxy Endpoints
 */
app.get('/api/youtube/search', async (req: express.Request, res: express.Response) => {
  try {
    const { q, maxResults, videoDuration, videoEmbeddable } = req.query;
		console.log(maxResults);
    const apiKey = process.env['YOUTUBE_API_KEY'];
    if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
      res.status(500).json({ error: 'YouTube API Key is not configured on the server. Please define YOUTUBE_API_KEY in your .env file.' });
      return;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('key', apiKey);
    
    if (q) url.searchParams.set('q', String(q));
    if (maxResults) url.searchParams.set('maxResults', String(maxResults));
    if (videoDuration) url.searchParams.set('videoDuration', String(videoDuration));
    if (videoEmbeddable) url.searchParams.set('videoEmbeddable', String(videoEmbeddable));

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/youtube/videos', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.query;
    const apiKey = process.env['YOUTUBE_API_KEY'];
    if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
      res.status(500).json({ error: 'YouTube API Key is not configured on the server. Please define YOUTUBE_API_KEY in your .env file.' });
      return;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('key', apiKey);
    
    if (id) url.searchParams.set('id', String(id));

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => response ? writeResponseToNodeResponse(response, res) : next())
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
