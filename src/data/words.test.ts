import { describe, expect, it, vi } from 'vitest';
import { formatTime, getRandomWord, shuffle, type Deck } from './words';

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(600)).toBe('10:00');
  });

  it('drops fractions', () => {
    expect(formatTime(59.9)).toBe('0:59');
  });

  it('treats invalid input as zero', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(out).not.toBe(input);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });
});

describe('getRandomWord', () => {
  const deck: Deck = {
    id: 't', title: 'T', locked: false, desc: '', art: '', art2: '',
    words: [
      { w: 'Apple', h: 'Fruit', wro: 'Măr', hro: 'Fruct' },
      { w: 'Chair', h: 'Seat' },
    ],
  };

  it('uses the Romanian word and hint when the language is ro', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getRandomWord(deck, 'ro')).toMatchObject({ word: 'Măr', hint: 'Fruct' });
    expect(getRandomWord(deck, 'en')).toMatchObject({ word: 'Apple', hint: 'Fruit' });
    vi.restoreAllMocks();
  });

  it('falls back to English when a word has no translation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(getRandomWord(deck, 'ro')).toMatchObject({ word: 'Chair', hint: 'Seat' });
    vi.restoreAllMocks();
  });
});
