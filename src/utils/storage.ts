import type { AppState, Card, Deck, ImportPayload, ThemeMode } from '../types';

export const APP_STORAGE_KEY = 'flashcards.app.v1';

const defaultState: AppState = {
  decks: [],
  selectedDeckId: null,
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
