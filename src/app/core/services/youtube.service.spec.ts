import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { YouTubeService } from './youtube.service';
import { YouTubeSearchResponse } from '../interfaces/youtube.interface';

describe('YouTubeService', () => {
  let service: YouTubeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [YouTubeService]
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
});
