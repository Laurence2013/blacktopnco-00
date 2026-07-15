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

  searchQuery = '';
  duration?: 'long' | 'medium' | 'short' = undefined;
  embeddableOnly = true;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  videos = signal<YouTubeVideo[]>([]);

  activeVideo = signal<YouTubeVideo | null>(null);

  activeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const video = this.activeVideo();
    if (!video) return null;
    const id = this.videoIdOf(video);
    const url = `https://www.youtube.com/embed/${id}?autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  executeSearch(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage.set('Please enter a search query.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.ytService.searchVideos(
      this.searchQuery,
      12,
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

  fetchAtmosphericWalking(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.searchQuery = 'Tokyo rain walking';

    this.ytService.fetchWalkingMoments(this.searchQuery, 12).subscribe({
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

  videoIdOf(video: YouTubeVideo): string {
    if (typeof video.id === 'object') {
      return video.id.videoId;
    }
    return video.id;
  }

  openPlayer(video: YouTubeVideo): void {
    this.activeVideo.set(video);
  }

  closePlayer(): void {
    this.activeVideo.set(null);
  }
}
