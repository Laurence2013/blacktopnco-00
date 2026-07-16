import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from '../../core/services/spotify.service';
import { SpotifyTrack } from '../../core/services/spotify.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-spotify',
  imports: [CommonModule, FormsModule],
  templateUrl: './spotify.component.html',
})
export class SpotifyComponent {
  private spotifyService = inject(SpotifyService);
  private sanitizer = inject(DomSanitizer);

  rawToken = '';
  searchQuery = '';
  limit = 12;

  tokenSaved = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  tracks = signal<SpotifyTrack[]>([]);

  activeTrack = signal<SpotifyTrack | null>(null);

  activeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const track = this.activeTrack();
    if (!track) return null;
    const url = `https://open.spotify.com/embed/track/${track.id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  saveAccessToken(): void {
    if (this.rawToken.trim()) {
      this.spotifyService.setAccessToken(this.rawToken.trim());
      this.tokenSaved.set(true);
      this.errorMessage.set(null);
    }
  }

  executeSearch(): void {
    if (!this.spotifyService.getAccessToken()) {
      this.errorMessage.set('Please save your OAuth Access Token first to authenticate requests.');
      return;
    }
    if (!this.searchQuery.trim()) {
      this.errorMessage.set('Please enter a search query.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.spotifyService.searchTracks(this.searchQuery, this.limit).subscribe({
      next: (response) => {
        this.tracks.set(response.tracks?.items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'An error occurred while fetching Spotify tracks.');
        this.isLoading.set(false);
      }
    });
  }

  getArtistsList(track: SpotifyTrack): string {
    return track.artists.map((a) => a.name).join(', ');
  }

  playTrack(track: SpotifyTrack): void {
    this.activeTrack.set(track);
  }

  closePlayer(): void {
    this.activeTrack.set(null);
  }
}
