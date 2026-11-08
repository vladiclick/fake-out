import { describe, expect, it } from 'vitest';
import { AVATARS, DECKS, PLAYER_THEMES } from './words';

describe('decks', () => {
  it('have unique ids', () => {
    const ids = DECKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const deck of DECKS) {
    describe(deck.id, () => {
      it('has enough words for an undercover pair', () => {
        expect(deck.words.length).toBeGreaterThanOrEqual(2);
      });

      it('has no duplicate words', () => {
        const words = deck.words.map((w) => w.w.toLowerCase());
        expect(new Set(words).size).toBe(words.length);
      });

      it('has a non-empty word and hint in both languages', () => {
        for (const w of deck.words) {
          expect(w.w.trim(), w.w).not.toBe('');
          expect(w.h.trim(), w.w).not.toBe('');
          expect(w.wro?.trim(), w.w).toBeTruthy();
          expect(w.hro?.trim(), w.w).toBeTruthy();
        }
      });

      it('never uses the word itself as its hint', () => {
        for (const w of deck.words) {
          expect(w.h.toLowerCase(), w.w).not.toBe(w.w.toLowerCase());
          expect(w.hro?.toLowerCase(), w.w).not.toBe(w.wro?.toLowerCase());
        }
      });
    });
  }
});

describe('player looks', () => {
  it('have avatars and themes to hand out', () => {
    expect(AVATARS.length).toBeGreaterThan(0);
    expect(PLAYER_THEMES.length).toBeGreaterThan(0);
  });
});
