import type { AppState, Card, Deck, ImportPayload, ThemeMode } from '../types';

export const APP_STORAGE_KEY = 'flashcards.app.v1';

const sampleDeck: Deck = {
  id: 'sample-deck-basic-20',
  name: '샘플 단어 20개',
  createdAt: '2026-04-11T00:00:00.000Z',
  updatedAt: '2026-04-11T00:00:00.000Z',
  cards: [
    { id: 'w-01', front: 'apple', back: '사과' },
    { id: 'w-02', front: 'book', back: '책' },
    { id: 'w-03', front: 'chair', back: '의자' },
    { id: 'w-04', front: 'door', back: '문' },
    { id: 'w-05', front: 'earth', back: '지구' },
    { id: 'w-06', front: 'friend', back: '친구' },
    { id: 'w-07', front: 'green', back: '초록색' },
    { id: 'w-08', front: 'happy', back: '행복한' },
    { id: 'w-09', front: 'island', back: '섬' },
    { id: 'w-10', front: 'journey', back: '여행' },
    { id: 'w-11', front: 'kitchen', back: '부엌' },
    { id: 'w-12', front: 'laugh', back: '웃다' },
    { id: 'w-13', front: 'mountain', back: '산' },
    { id: 'w-14', front: 'night', back: '밤' },
    { id: 'w-15', front: 'ocean', back: '바다' },
    { id: 'w-16', front: 'pencil', back: '연필' },
    { id: 'w-17', front: 'quiet', back: '조용한' },
    { id: 'w-18', front: 'river', back: '강' },
    { id: 'w-19', front: 'sunshine', back: '햇빛' },
    { id: 'w-20', front: 'window', back: '창문' }
  ]
};

const defaultState: AppState = {
  decks: [sampleDeck],
  selectedDeckId: sampleDeck.id,
  theme: 'system'
};

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object') return false;
  const card = value as Card;
  return (
    typeof card.id === 'string' &&
    typeof card.front === 'string' &&
    typeof card.back === 'string'
  );
}

function isDeck(value: unknown): value is Deck {
  if (!value || typeof value !== 'object') return false;
  const deck = value as Deck;
  return (
    typeof deck.id === 'string' &&
    typeof deck.name === 'string' &&
    typeof deck.createdAt === 'string' &&
    typeof deck.updatedAt === 'string' &&
    Array.isArray(deck.cards) &&
    deck.cards.every(isCard)
  );
}

function isTheme(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function isImportPayload(value: unknown): value is ImportPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as ImportPayload;
  return Array.isArray(payload.decks) && payload.decks.every(isDeck);
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  const raw = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const decks = Array.isArray(parsed.decks) ? parsed.decks.filter(isDeck) : [];
    const selectedDeckId =
      typeof parsed.selectedDeckId === 'string' && decks.some((d) => d.id === parsed.selectedDeckId)
        ? parsed.selectedDeckId
        : decks[0]?.id ?? null;
    const theme = isTheme(parsed.theme) ? parsed.theme : 'system';

    if (decks.length === 0) {
      return defaultState;
    }

    return { decks, selectedDeckId, theme };
  } catch {
    return defaultState;
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

export function mergeDecks(current: Deck[], incoming: Deck[]): Deck[] {
  const byId = new Map<string, Deck>(current.map((deck) => [deck.id, deck]));

  for (const inDeck of incoming) {
    const existing = byId.get(inDeck.id);
    if (!existing) {
      byId.set(inDeck.id, inDeck);
      continue;
    }

    const cardsById = new Map<string, Card>(existing.cards.map((card) => [card.id, card]));
    for (const card of inDeck.cards) {
      cardsById.set(card.id, card);
    }

    byId.set(inDeck.id, {
      ...existing,
      name: inDeck.name,
      updatedAt: new Date().toISOString(),
      cards: Array.from(cardsById.values())
    });
  }

  return Array.from(byId.values());
}
