export const MUSIC_GENRES = [
  { id: 'pop-rock', name: 'Pop/Rock', emoji: '🎸', color: 'from-orange-500 to-red-500' },
  { id: 'synthwave', name: 'Synthwave', emoji: '🌆', color: 'from-purple-500 to-pink-500' },
  { id: 'punk-rock', name: 'Punk Rock', emoji: '🤘', color: 'from-red-600 to-orange-500' },
  { id: 'rnb', name: 'R&B', emoji: '💜', color: 'from-violet-500 to-purple-600' },
  { id: 'reggae', name: 'Reggae', emoji: '🟢', color: 'from-green-500 to-yellow-500' },
  { id: 'ska', name: 'Ska', emoji: '🎺', color: 'from-amber-400 to-orange-500' },
  { id: 'soul', name: 'Soul', emoji: '🎤', color: 'from-rose-500 to-pink-600' },
  { id: 'northern-soul', name: 'Northern Soul', emoji: '💃', color: 'from-blue-500 to-indigo-600' },
  { id: 'rap', name: 'Rap', emoji: '🎧', color: 'from-gray-600 to-zinc-800' },
  { id: 'gfunk', name: 'G-Funk', emoji: '🚗', color: 'from-cyan-500 to-blue-600' },
  { id: 'funk', name: 'Funk', emoji: '🕺', color: 'from-fuchsia-500 to-purple-600' },
] as const;

export type GenreId = typeof MUSIC_GENRES[number]['id'];

export interface Checkpoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  validated: boolean;
  validatedAt?: Date;
}

export interface Journey {
  id: string;
  name: string;
  startPoint: [number, number];
  endPoint: [number, number];
  checkpoints: Checkpoint[];
  routeCoordinates?: [number, number][]; // Actual pedestrian route path
  createdAt: Date;
}

export interface MusicReward {
  id: string;
  title: string;
  artist: string;
  genre: GenreId;
  spotifyUrl: string;
  deezerUrl: string;
  appleMusicUrl: string;
  earnedAt: Date;
  journeyId: string;
}

export interface UserProfile {
  selectedGenre: GenreId | null;
  currentJourney: Journey | null;
  completedJourneys: string[];
  rewards: MusicReward[];
  mapboxToken: string | null;
}

export interface AppState {
  user: UserProfile;
  isJourneyActive: boolean;
  currentPosition: [number, number] | null;
}
