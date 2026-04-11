import { describe, expect, it } from 'vitest';
import {
  applyOrder,
  buildQueue,
  clampIndex,
  nextIndex,
  prevIndex,
  progressLabel,
  seededShuffle
} from './queue';
import type { Card } from '../types';

const cards: Card[] = [
  { id: '1', front: 'A', back: 'a' },
  { id: '2', front: 'B', back: 'b' },
  { id: '3', front: 'C', back: 'c' }
];

describe('queue utils', () => {
  it('applies sequential and reverse order', () => {
    expect(applyOrder(cards, 'sequential').map((x) => x.id)).toEqual(['1', '2', '3']);
    expect(applyOrder(cards, 'reverse').map((x) => x.id)).toEqual(['3', '2', '1']);
  });

  it('shuffles deterministically by seed', () => {
    const one = seededShuffle(cards, 7).map((x) => x.id);
    const two = seededShuffle(cards, 7).map((x) => x.id);
    const three = seededShuffle(cards, 9).map((x) => x.id);

    expect(one).toEqual(two);
    expect(three).not.toEqual(one);
  });

  it('builds queue with and without shuffle', () => {
    expect(buildQueue(cards, 'reverse', false).map((x) => x.id)).toEqual(['3', '2', '1']);
    expect(buildQueue(cards, 'sequential', true, 1)).toHaveLength(3);
  });

  it('computes indices and progress', () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(20, 3)).toBe(2);
    expect(nextIndex(2, 3)).toBe(0);
    expect(prevIndex(0, 3)).toBe(2);
    expect(progressLabel(1, 3)).toBe('2 / 3');
    expect(progressLabel(0, 0)).toBe('0 / 0');
  });
});
