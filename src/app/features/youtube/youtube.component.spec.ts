import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { YouTubeComponent } from './youtube.component';
import { YouTubeService } from '../../core/services/youtube.service';
import { of, throwError } from 'rxjs';
import { YouTubeSearchResponse } from '../../core/interfaces/youtube.interface';

describe('YouTubeComponent', () => {
  let component: YouTubeComponent;
  let fixture: ComponentFixture<YouTubeComponent>;
  let mockYouTubeService: any;

  const mockResponse: YouTubeSearchResponse = {
    items: [
      {
        id: { videoId: 'sF80I-TQiW0' },
        snippet: {
          title: '90s Chill Lofi',
          description: 'Lofi background music',
          thumbnails: {
            default: { url: 'https://i.ytimg.com/mock.jpg' },
            medium: { url: 'https://i.ytimg.com/mock.jpg' },
            high: { url: 'https://i.ytimg.com/mock.jpg' }
          },
          channelTitle: 'Lofi Station'
        }
      }
    ]
  };

  beforeEach(async () => {
    mockYouTubeService = {
      searchVideos: vi.fn().mockReturnValue(of(mockResponse)),
      fetchWalkingMoments: vi.fn().mockReturnValue(of(mockResponse))
    };

    await TestBed.configureTestingModule({
      imports: [YouTubeComponent],
      providers: [
        { provide: YouTubeService, useValue: mockYouTubeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YouTubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.searchQuery).toBe('');
    expect(component.videos()).toEqual([]);
    expect(component.activeVideo()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('should not search if search query is empty', () => {
    component.searchQuery = '   ';
    component.executeSearch();
    expect(mockYouTubeService.searchVideos).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please enter a search query.');
  });

  it('should perform search and populate videos signal', () => {
    component.searchQuery = 'lofi hip hop';
    component.executeSearch();

    expect(component.isLoading()).toBe(false);
    expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith('lofi hip hop', 24, undefined, true);
    expect(component.videos()).toEqual(mockResponse.items);
    expect(component.errorMessage()).toBeNull();
  });

  it('should handle search error gracefully', () => {
    mockYouTubeService.searchVideos.mockReturnValue(
      throwError(() => ({ error: { error: 'Quota exceeded' } }))
    );

    component.searchQuery = 'lofi';
    component.executeSearch();

    expect(component.isLoading()).toBe(false);
    expect(component.videos()).toEqual([]);
    expect(component.errorMessage()).toBe('Quota exceeded');
  });

  it('should trigger fetchAtmosphericWalking with predefined query', () => {
    component.fetchAtmosphericWalking();

    expect(component.searchQuery).toBe('Tokyo rain walking');
    expect(mockYouTubeService.fetchWalkingMoments).toHaveBeenCalledWith('Tokyo rain walking', 24);
    expect(component.videos()).toEqual(mockResponse.items);
    expect(component.isLoading()).toBe(false);
  });

  it('should open and close the player correctly and compute safe embed URL', () => {
    const video = mockResponse.items[0];
    component.openPlayer(video);

    expect(component.activeVideo()).toEqual(video);
    expect(component.activeEmbedUrl()).toBeDefined();

    // Verify it generates the proper embed URL structure
    const safeUrl = component.activeEmbedUrl();
    expect(safeUrl).not.toBeNull();

    component.closePlayer();
    expect(component.activeVideo()).toBeNull();
    expect(component.activeEmbedUrl()).toBeNull();
  });
});
