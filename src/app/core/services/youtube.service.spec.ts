import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { YouTubeService } from './youtube.service';
import { YouTubeSearchResponse } from '../interfaces/youtube.interface';

describe('YouTubeService', () => {
  let service: YouTubeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        YouTubeService
      ]
    });
    service = TestBed.inject(YouTubeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call the proxy API with search parameters', () => {
    const mockResponse: YouTubeSearchResponse = {
      items: [
        {
          id: { videoId: 'sF80I-TQiW0' },
          snippet: {
            title: '90s Chill Lofi',
            description: 'Study Music Lofi',
            thumbnails: {
              default: { url: 'https://i.ytimg.com/vi/sF80I-TQiW0/default.jpg' },
              medium: { url: 'https://i.ytimg.com/vi/sF80I-TQiW0/mqdefault.jpg' },
              high: { url: 'https://i.ytimg.com/vi/sF80I-TQiW0/hqdefault.jpg' }
            },
            channelTitle: 'The Japanese Town'
          }
        }
      ]
    };

    service.searchVideos('lofi', 5).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.items.length).toBe(1);
      expect(response.items[0].snippet.title).toBe('90s Chill Lofi');
    });

    const req = httpMock.expectOne('/api/youtube/search?q=lofi&maxResults=5');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should format search query with exclusions for atmospheric walking moments', () => {
    const mockResponse: YouTubeSearchResponse = { items: [] };

    service.fetchWalkingMoments('Tokyo rain', 10).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    // It should append the vlog/talking noise exclusions and set long duration + embeddable
    const expectedQuery = 'Tokyo rain -vlog -talking -review -guide -narrated -interview -talk';
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/youtube/search' &&
        r.params.get('q') === expectedQuery &&
        r.params.get('maxResults') === '10' &&
        r.params.get('videoDuration') === 'long' &&
        r.params.get('videoEmbeddable') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call the proxy API for specific video details', () => {
    const mockDetailResponse = { kind: 'youtube#videoListResponse', items: [{ id: 'sF80I-TQiW0' }] };

    service.getVideoDetails('sF80I-TQiW0').subscribe((response) => {
      expect(response).toEqual(mockDetailResponse);
    });

    const req = httpMock.expectOne('/api/youtube/videos?id=sF80I-TQiW0');
    expect(req.request.method).toBe('GET');
    req.flush(mockDetailResponse);
  });
});

