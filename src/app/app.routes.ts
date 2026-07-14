import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'youtube',
    pathMatch: 'full'
  },
  {
    path: 'youtube',
    loadComponent: () => import('./features/youtube/youtube.component').then(m => m.YouTubeComponent)
  },
  {
    path: 'spotify',
    loadComponent: () => import('./features/spotify/spotify.component').then(m => m.SpotifyComponent)
  }
];
