import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpotifyComponent } from './spotify.component';
import { SpotifyService, SpotifyTrack, SpotifySearchResponse } from '../../core/services/spotify.service';
import { of, throwError } from 'rxjs';

describe('SpotifyComponent', () => {
  let component: SpotifyComponent;
  let fixture: ComponentFixture<SpotifyComponent>;
  let mockSpotifyService: any;
  let tokenStore = '';

  const mockTrack: SpotifyTrack = {
    id: '4PTG3Z6ehGkBF2zI7Y1jVf',
    name: 'Never Gonna Give You Up',
    artists: [{ name: 'Rick Astley' }, { name: 'Another Artist' }],
    album: { name: 'Whenever You Need Somebody', images: [{ url: 'https://i.scdn.co/mock.jpg' }] },
    uri: 'spotify:track:4PTG3Z6ehGkBF2zI7Y1jVf'
  };

  const mockSearchResponse: SpotifySearchResponse = {
    tracks: {
      items: [mockTrack]
    }
  };

  beforeEach(async () => {
    tokenStore = '';
    mockSpotifyService = {
      setAccessToken: vi.fn().mockImplementation((t) => { tokenStore = t; }),
      getAccessToken: vi.fn().mockImplementation(() => tokenStore || null),
      searchTracks: vi.fn().mockReturnValue(of(mockSearchResponse)),
      getTrack: vi.fn().mockReturnValue(of(mockTrack))
    };

    await TestBed.configureTestingModule({
      imports: [SpotifyComponent],
      providers: [
        { provide: SpotifyService, useValue: mockSpotifyService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpotifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.rawToken).toBe('');
    expect(component.searchQuery).toBe('');
    expect(component.tracks()).toEqual([]);
    expect(component.activeTrack()).toBeNull();
  });

  it('should save the access token and update UI status', () => {
    component.rawToken = '  my-test-bearer-token  ';
    component.saveAccessToken();

    expect(mockSpotifyService.setAccessToken).toHaveBeenCalledWith('my-test-bearer-token');
    expect(component.tokenSaved()).toBe(true);
    expect(component.errorMessage()).toBeNull();
  });

  it('should not search if OAuth Access Token is not set', () => {
    component.searchQuery = 'lofi';
    component.executeSearch();

    expect(mockSpotifyService.searchTracks).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Please save your OAuth Access Token first');
  });

  it('should not search if search query is empty', () => {
    tokenStore = 'valid-token';
    component.searchQuery = '   ';
    component.executeSearch();

    expect(mockSpotifyService.searchTracks).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please enter a search query.');
  });

  it('should perform search when token is set and query is present', () => {
    tokenStore = 'valid-token';
    component.searchQuery = 'chill';
    component.limit = 6;
    component.executeSearch();

    expect(component.isLoading()).toBe(false);
    expect(mockSpotifyService.searchTracks).toHaveBeenCalledWith('chill', 6);
    expect(component.tracks()).toEqual(mockSearchResponse.tracks.items);
    expect(component.errorMessage()).toBeNull();
  });

  it('should handle search errors gracefully', () => {
    tokenStore = 'valid-token';
    mockSpotifyService.searchTracks.mockReturnValue(
      throwError(() => new Error('Invalid token or expired'))
    );

    component.searchQuery = 'jazz';
    component.executeSearch();

    expect(component.isLoading()).toBe(false);
    expect(component.tracks()).toEqual([]);
    expect(component.errorMessage()).toBe('Invalid token or expired');
  });

  it('should format the list of artists properly', () => {
    const artists = component.getArtistsList(mockTrack);
    expect(artists).toBe('Rick Astley, Another Artist');
  });

  it('should manage track playback and safe embed URL mapping', () => {
    component.playTrack(mockTrack);

    expect(component.activeTrack()).toEqual(mockTrack);
    expect(component.activeEmbedUrl()).toBeDefined();

    component.closePlayer();
    expect(component.activeTrack()).toBeNull();
    expect(component.activeEmbedUrl()).toBeNull();
  });
});
