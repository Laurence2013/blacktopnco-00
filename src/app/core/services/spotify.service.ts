import { Service, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

@Service()
export class SpotifyService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://api.spotify.com/v1';

  // BehaviorSubject to store the access token reactively
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  accessToken$ = this.accessTokenSubject.asObservable();

  /**
   * Set the active access token for API requests.
   */
  setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
  }

  /**
   * Get the current token value synchronously.
   */
  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  /**
   * Helper to build authentication headers reactively.
   */
  private getHeaders(): Observable<HttpHeaders> {
    return this.accessToken$.pipe(
      take(1),
      switchMap(token => {
        const headers = new HttpHeaders({
          Authorization: token ? `Bearer ${token}` : '',
        });
        return of(headers);
      })
    );
  }

  /**
   * Search for tracks on Spotify.
   */
  searchTracks(query: string, limit = 20): Observable<SpotifySearchResponse> {
    return this.getHeaders().pipe(
      switchMap(headers => {
        const params = new HttpParams()
          .set('q', query)
          .set('type', 'track')
          .set('limit', limit.toString());

        return this.http.get<SpotifySearchResponse>(`${this.baseUrl}/search`, {
          headers,
          params,
        });
      })
    );
  }

  /**
   * Fetch details for a specific track.
   */
  getTrack(trackId: string): Observable<SpotifyTrack> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<SpotifyTrack>(`${this.baseUrl}/tracks/${trackId}`, {
          headers,
        })
      )
    );
  }
}
