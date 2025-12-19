// ============= Dinosaur Types for Dino Quest =============

export const DINO_TYPES = [
  { id: 't-rex', name: 'T-Rex', emoji: '🦖', color: 'from-green-500 to-emerald-600' },
  { id: 'triceratops', name: 'Tricératops', emoji: '🦕', color: 'from-blue-500 to-cyan-500' },
  { id: 'velociraptor', name: 'Vélociraptor', emoji: '🦖', color: 'from-orange-500 to-red-500' },
  { id: 'stegosaurus', name: 'Stégosaure', emoji: '🦕', color: 'from-purple-500 to-pink-500' },
  { id: 'pterodactyl', name: 'Ptérodactyle', emoji: '🦅', color: 'from-sky-400 to-blue-500' },
  { id: 'brachiosaurus', name: 'Brachiosaure', emoji: '🦕', color: 'from-amber-500 to-yellow-500' },
  { id: 'ankylosaurus', name: 'Ankylosaure', emoji: '🦖', color: 'from-slate-500 to-gray-600' },
  { id: 'spinosaurus', name: 'Spinosaure', emoji: '🦖', color: 'from-teal-500 to-emerald-500' },
] as const;

export type DinoTypeId = typeof DINO_TYPES[number]['id'];

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

// New dinosaur reward type
export interface DinoReward {
  id: string;
  dinoName: string;
  dinoType: DinoTypeId;
  imageUrl: string; // Base64 or URL of the generated dinosaur image
  earnedAt: Date;
  journeyId: string;
}

// Keep music types hidden for later use
export interface MusicReward {
  id: string;
  title: string;
  artist: string;
  genre: string;
  spotifyUrl: string;
  deezerUrl: string;
  appleMusicUrl: string;
  earnedAt: Date;
  journeyId: string;
}

// Legacy music genres - kept for later use
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

export interface UserProfile {
  selectedDinoType: DinoTypeId | null;
  currentJourney: Journey | null;
  completedJourneys: string[];
  dinoRewards: DinoReward[];
  mapboxToken: string | null;
  // Legacy fields - kept for later use
  selectedGenre?: GenreId | null;
  rewards?: MusicReward[];
}

export interface AppState {
  user: UserProfile;
  isJourneyActive: boolean;
  currentPosition: [number, number] | null;
}
