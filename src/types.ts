export type ThemeMode = 'light' | 'dark' | 'system';

export type LanguageMode = 'front-to-back' | 'back-to-front';
export type DisplayMode = 'front-only' | 'flip';
export type OrderMode = 'sequential' | 'reverse';

export interface Card {
  id: string;
  front: string;
  back: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  decks: Deck[];
  selectedDeckId: string | null;
  theme: ThemeMode;
}

export interface ImportPayload {
  decks: Deck[];
}
