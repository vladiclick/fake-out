import { describe, expect, it } from 'vitest';
import { dealRoles } from './deal';

describe('dealRoles', () => {
  it('picks the requested number of distinct imposters', () => {
    for (let n = 0; n < 50; n++) {
      const { imposters } = dealRoles(7, 3);
      expect(imposters).toHaveLength(3);
      expect(new Set(imposters).size).toBe(3);
      for (const i of imposters) expect(i).toBeGreaterThanOrEqual(0);
      for (const i of imposters) expect(i).toBeLessThan(7);
    }
  });

  it('puts every player in the speaking order once', () => {
    const { turnOrder } = dealRoles(6, 1);
    expect([...turnOrder].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('does not always let an imposter speak first', () => {
    // With 5 players and 1 imposter the first speaker should be the imposter
    // about 1 time in 5; 300 rounds of "always" would mean the order leaks it.
    let imposterFirst = 0;
    const rounds = 300;
    for (let n = 0; n < rounds; n++) {
      const { imposters, turnOrder } = dealRoles(5, 1);
      if (imposters.includes(turnOrder[0])) imposterFirst++;
    }
    expect(imposterFirst).toBeGreaterThan(0);
    expect(imposterFirst).toBeLessThan(rounds / 2);
  });
});
