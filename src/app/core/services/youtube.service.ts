import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { YouTubeVideo, YouTubeSearchResponse } from '../interfaces/youtube.interface';

@Service()
export class YouTubeService {
  private http = inject(HttpClient);
  // Base URL pointing to the secure Express proxy endpoints
  private readonly baseUrl = '/api/youtube';

  /**
   * Enhanced Core Search Method
   * Proxied through our secure node backend which dynamically attaches the API Key.
   */
  searchVideos(
    query: string, 
    maxResults = 24, 
    duration?: 'long' | 'medium' | 'short', 
    embeddableOnly = false
  ): Observable<YouTubeSearchResponse> {
    let params = new HttpParams()
      .set('q', query)
      .set('maxResults', maxResults.toString());

    if (duration) params = params.set('videoDuration', duration);
    if (embeddableOnly) params = params.set('videoEmbeddable', 'true');

    return this.http.get<YouTubeSearchResponse>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Specific helper to fetch quiet, atmospheric walking videos.
   * Automates the exclusion of loud talking vlogs, reviews, and guides.
   */
  fetchWalkingMoments(subcategoryQuery: string, maxResults = 24): Observable<YouTubeSearchResponse> {
    const excludeNoise = ' -vlog -talking -review -guide -narrated -interview -talk';
    const fullQuery = `${subcategoryQuery}${excludeNoise}`;

    // Forces long-form (>20 mins) and embeddable assets only
    return this.searchVideos(fullQuery, maxResults, 'long', true);
  }

  getVideoDetails(videoId: string): Observable<unknown> {
    const params = new HttpParams().set('id', videoId);
    return this.http.get<unknown>(`${this.baseUrl}/videos`, { params });
  }
}
