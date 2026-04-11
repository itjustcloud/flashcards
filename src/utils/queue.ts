import type { Card, OrderMode } from '../types';

export function seededShuffle<T>(items: T[], seed = 1): T[] {
  const output = [...items];
  let state = seed;

  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }

  return output;
}

export function applyOrder(cards: Card[], orderMode: OrderMode): Card[] {
  if (orderMode === 'reverse') {
    return [...cards].reverse();
  }

  return [...cards];
}

export function buildQueue(
  cards: Card[],
  orderMode: OrderMode,
  shuffleMode: boolean,
  seed?: number
): Card[] {
  const ordered = applyOrder(cards, orderMode);
  if (!shuffleMode) {
    return ordered;
  }

  return seededShuffle(ordered, seed);
}

export function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

export function nextIndex(current: number, length: number): number {
  if (length === 0) return 0;
  return (current + 1) % length;
}

export function prevIndex(current: number, length: number): number {
  if (length === 0) return 0;
  return (current - 1 + length) % length;
}

export function progressLabel(current: number, length: number): string {
  if (length === 0) return '0 / 0';
  return `${current + 1} / ${length}`;
}
