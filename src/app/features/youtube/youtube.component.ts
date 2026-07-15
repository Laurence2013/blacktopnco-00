import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YouTubeService } from '../../core/services/youtube.service';
import { YouTubeVideo } from '../../core/interfaces/youtube.interface';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-youtube',
  imports: [CommonModule, FormsModule],
  templateUrl: './youtube.component.html',
})
export class YouTubeComponent {
  private ytService = inject(YouTubeService);
  private sanitizer = inject(DomSanitizer);

  public searchQuery = '';
  public duration?: 'long' | 'medium' | 'short' = undefined;
  public embeddableOnly = true;

  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public videos = signal<YouTubeVideo[]>([]);

  public activeVideo = signal<YouTubeVideo | null>(null);

  public activeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const video = this.activeVideo();
    if (!video) return null;
    const id = this.videoIdOf(video);
    const url = `https://www.youtube.com/embed/${id}?autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
  public executeSearch(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage.set('Please enter a search query.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.ytService.searchVideos(
      this.searchQuery,
      24,
      this.duration,
      this.embeddableOnly
    ).subscribe({
      next: (response) => {
        this.videos.set(response.items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        const backendError = err.error?.error || err.message;
        this.errorMessage.set(backendError || 'An error occurred while fetching videos.');
        this.isLoading.set(false);
      }
    });
  }
  public fetchAtmosphericWalking(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.searchQuery = 'Tokyo rain walking';

    this.ytService.fetchWalkingMoments(this.searchQuery, 24).subscribe({
      next: (response) => {
        this.videos.set(response.items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        const backendError = err.error?.error || err.message;
        this.errorMessage.set(backendError || 'An error occurred while fetching atmospheric content.');
        this.isLoading.set(false);
      }
    });
  }
  public videoIdOf(video: YouTubeVideo): string {
    if (typeof video.id === 'object') {
      return video.id.videoId;
    }
    return video.id;
  }
  public openPlayer(video: YouTubeVideo): void {
    this.activeVideo.set(video);
  }
  public closePlayer(): void {
    this.activeVideo.set(null);
  }
}
