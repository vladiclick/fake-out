import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getXPLevelInfo,
  loadAchievements,
  loadMatchHistory,
  loadXP,
  logMatchResult,
  type LogMatchParams,
} from './stats';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k); },
    setItem: (k, v) => { data.set(k, String(v)); },
  };
}

const crewWin: LogMatchParams = {
  deckId: 'party',
  playerCount: 5,
  imposters: ['Ana'],
  votedOut: 'Ana',
  winner: 'crew',
  playerWasImposter: false,
  votedCorrectly: true,
  roundDuration: 180,
  currentLang: 'en',
};

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 1, 12, 0)); // noon, so night_owl stays locked
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getXPLevelInfo', () => {
  it('follows the L * 500 curve', () => {
    expect(getXPLevelInfo(0)).toMatchObject({ level: 1, currentXP: 0, nextLevelXP: 500 });
    expect(getXPLevelInfo(499)).toMatchObject({ level: 1, currentXP: 499 });
    expect(getXPLevelInfo(500)).toMatchObject({ level: 2, currentXP: 0, nextLevelXP: 1000 });
    expect(getXPLevelInfo(1500)).toMatchObject({ level: 3, currentXP: 0, nextLevelXP: 1500 });
  });

  it('reports progress through the level', () => {
    expect(getXPLevelInfo(1000).percent).toBe(50);
  });
});

describe('loadXP', () => {
  it('reads stored XP and ignores junk or negative values', () => {
    localStorage.setItem('fakeit.xp', '1200');
    expect(loadXP()).toBe(1200);
    localStorage.setItem('fakeit.xp', 'abc');
    expect(loadXP()).toBe(0);
    localStorage.setItem('fakeit.xp', '-300');
    expect(loadXP()).toBe(0);
  });
});

describe('logMatchResult', () => {
  it('gives 250 XP to crew that won and voted right', () => {
    expect(logMatchResult(crewWin).xpEarned).toBe(250);
    expect(loadXP()).toBe(250);
  });

  it('gives 300 XP to a winning imposter and 100 to a losing one', () => {
    const imposter = { ...crewWin, playerWasImposter: true, votedCorrectly: false };
    expect(logMatchResult({ ...imposter, winner: 'imposter' }).xpEarned).toBe(300);
    expect(logMatchResult({ ...imposter, winner: 'crew' }).xpEarned).toBe(100);
  });

  it('reports a level up', () => {
    logMatchResult(crewWin);
    const r = logMatchResult(crewWin);
    expect(r).toMatchObject({ leveledUp: true, oldLevel: 1, newLevel: 2 });
  });

  it('keeps the last 50 matches, newest first', () => {
    for (let i = 0; i < 55; i++) logMatchResult({ ...crewWin, deckId: `d${i}` });
    const history = loadMatchHistory();
    expect(history).toHaveLength(50);
    expect(history[0].deckId).toBe('d54');
  });

  it('unlocks sherlock after three crew wins in a row', () => {
    expect(logMatchResult(crewWin).newlyUnlockedAchievements).not.toContain('sherlock');
    logMatchResult(crewWin);
    expect(logMatchResult(crewWin).newlyUnlockedAchievements).toContain('sherlock');
  });

  it('unlocks deception when the imposter wins and someone else is voted out', () => {
    const r = logMatchResult({ ...crewWin, winner: 'imposter', votedOut: 'Bogdan', votedCorrectly: false });
    expect(r.newlyUnlockedAchievements).toContain('deception');
  });

  it('unlocks double agent on the fifth game as imposter', () => {
    const imposter = { ...crewWin, playerWasImposter: true };
    for (let i = 0; i < 4; i++) {
      expect(logMatchResult(imposter).newlyUnlockedAchievements).not.toContain('double_agent');
    }
    expect(logMatchResult(imposter).newlyUnlockedAchievements).toContain('double_agent');
  });

  it('unlocks polyglot, hardcore and night owl from the round details', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 0));
    const r = logMatchResult({ ...crewWin, currentLang: 'ro', roundDuration: 45 });
    expect(r.newlyUnlockedAchievements).toEqual(expect.arrayContaining(['polyglot', 'hardcore', 'night_owl']));
  });

  it('unlocks each achievement only once', () => {
    const ro = { ...crewWin, currentLang: 'ro' };
    expect(logMatchResult(ro).newlyUnlockedAchievements).toContain('polyglot');
    expect(logMatchResult(ro).newlyUnlockedAchievements).not.toContain('polyglot');
    expect(loadAchievements().filter((a) => a === 'polyglot')).toHaveLength(1);
  });
});
