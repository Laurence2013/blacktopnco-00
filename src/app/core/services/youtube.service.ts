import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { YouTubeVideo, YouTubeSearchResponse } from '../interfaces/youtube.interface';

@Service()
export class YouTubeService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  private apiKeySubject = new BehaviorSubject<string | null>(null);
  apiKey$ = this.apiKeySubject.asObservable();

  setApiKey(key: string): void {
    this.apiKeySubject.next(key);
  }

  getApiKey(): string | null {
    return this.apiKeySubject.value;
  }

  private getApiKeyStream(): Observable<string> {
    return this.apiKey$.pipe(
      take(1),
      switchMap(key => {
        if (!key) {
          return throwError(() => new Error('YouTube API Key is not set.'));
        }
        return of(key);
      })
    );
  }

  /**
   * Enhanced Core Search Method
   * Added support for videoDuration and videoEmbeddable parameters
   */
  searchVideos(
    query: string, 
    maxResults = 10, 
    duration?: 'long' | 'medium' | 'short', 
    embeddableOnly = false
  ): Observable<YouTubeSearchResponse> {
    return this.getApiKeyStream().pipe(
      switchMap(key => {
        let params = new HttpParams()
          .set('part', 'snippet')
          .set('q', query)
          .set('type', 'video')
          .set('maxResults', maxResults.toString())
          .set('key', key);

        if (duration) {
          params = params.set('videoDuration', duration);
        }
        if (embeddableOnly) {
          params = params.set('videoEmbeddable', 'true');
        }

        return this.http.get<YouTubeSearchResponse>(`${this.baseUrl}/search`, { params });
      })
    );
  }

  /**
   * Specific helper to fetch quiet, atmospheric walking videos.
   * Automates the exclusion of loud talking vlogs, reviews, and guides.
   */
  fetchWalkingMoments(subcategoryQuery: string, maxResults = 10): Observable<YouTubeSearchResponse> {
    const excludeNoise = ' -vlog -talking -review -guide -narrated -interview -talk';
    const fullQuery = `${subcategoryQuery}${excludeNoise}`;

    // Forces long-form (>20 mins) and embeddable assets only
    return this.searchVideos(fullQuery, maxResults, 'long', true);
  }

  getVideoDetails(videoId: string): Observable<unknown> {
    return this.getApiKeyStream().pipe(
      switchMap(key => {
        const params = new HttpParams()
          .set('part', 'snippet,statistics')
          .set('id', videoId)
          .set('key', key);

        return this.http.get<unknown>(`${this.baseUrl}/videos`, { params });
      })
    );
  }
}
