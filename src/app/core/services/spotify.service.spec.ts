import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SpotifyService, SpotifyTrack, SpotifySearchResponse } from './spotify.service';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SpotifyService
      ]
    });
    service = TestBed.inject(SpotifyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.getAccessToken()).toBeNull();
  });

  it('should store access token reactively', () => {
    service.setAccessToken('my-test-token');
    expect(service.getAccessToken()).toBe('my-test-token');
  });

  it('should attach Bearer token to headers in searchTracks requests', () => {
    const mockTrack: SpotifyTrack = {
      id: '4PTG3Z6ehGkBF2zI7Y1jVf',
      name: 'Never Gonna Give You Up',
      artists: [{ name: 'Rick Astley' }],
      album: { name: 'Whenever You Need Somebody', images: [{ url: 'https://i.scdn.co/mock.jpg' }] },
      uri: 'spotify:track:4PTG3Z6ehGkBF2zI7Y1jVf'
    };
    const mockResponse: SpotifySearchResponse = {
      tracks: {
        items: [mockTrack]
      }
    };

    service.setAccessToken('my-test-token');

    service.searchTracks('Rick Astley', 5).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.tracks.items.length).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'https://api.spotify.com/v1/search' &&
        r.params.get('q') === 'Rick Astley' &&
        r.params.get('type') === 'track' &&
        r.params.get('limit') === '5'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-token');
    req.flush(mockResponse);
  });

  it('should attach Bearer token to headers in getTrack requests', () => {
    const mockTrack: SpotifyTrack = {
      id: '4PTG3Z6ehGkBF2zI7Y1jVf',
      name: 'Never Gonna Give You Up',
      artists: [{ name: 'Rick Astley' }],
      album: { name: 'Whenever You Need Somebody', images: [{ url: 'https://i.scdn.co/mock.jpg' }] },
      uri: 'spotify:track:4PTG3Z6ehGkBF2zI7Y1jVf'
    };

    service.setAccessToken('another-token');

    service.getTrack('4PTG3Z6ehGkBF2zI7Y1jVf').subscribe((response) => {
      expect(response).toEqual(mockTrack);
    });

    const req = httpMock.expectOne('https://api.spotify.com/v1/tracks/4PTG3Z6ehGkBF2zI7Y1jVf');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer another-token');
    req.flush(mockTrack);
  });
});
