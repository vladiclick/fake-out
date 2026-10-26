export interface MatchRecord {
  id: string;
  timestamp: string;
  deckId: string;
  playerCount: number;
  imposters: string[];
  votedOut: string | null;
  winner: 'imposter' | 'crew';
  playerWasImposter: boolean;
  xpEarned: number;
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  percent: number;
}

export interface Achievement {
  id: string;
  titleKey: string;
  descKey: string;
  emoji: string;
  unlocked: boolean;
}

// Default achievements definitions
export const ACHIEVEMENT_DEFS = [
  {
    id: 'sherlock',
    titleKey: 'achSherlockTitle',
    descKey: 'achSherlockDesc',
    emoji: '🕵️‍♂️',
  },
  {
    id: 'deception',
    titleKey: 'achDeceptionTitle',
    descKey: 'achDeceptionDesc',
    emoji: '🎭',
  },
  {
    id: 'double_agent',
    titleKey: 'achDoubleAgentTitle',
    descKey: 'achDoubleAgentDesc',
    emoji: '🕶️',
  },
  {
    id: 'night_owl',
    titleKey: 'achNightOwlTitle',
    descKey: 'achNightOwlDesc',
    emoji: '🦉',
  },
  {
    id: 'polyglot',
    titleKey: 'achPolyglotTitle',
    descKey: 'achPolyglotDesc',
    emoji: '🇷🇴',
  },
  {
    id: 'hardcore',
    titleKey: 'achHardcoreTitle',
    descKey: 'achHardcoreDesc',
    emoji: '⏱️',
  },
];

export function loadMatchHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem('fakeit.matchHistory');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMatchHistory(history: MatchRecord[]): void {
  try {
    localStorage.setItem('fakeit.matchHistory', JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function loadXP(): number {
  try {
    const raw = localStorage.getItem('fakeit.xp');
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function saveXP(xp: number): void {
  try {
    localStorage.setItem('fakeit.xp', xp.toString());
  } catch {
    /* ignore */
  }
}

export function loadAchievements(): string[] {
  try {
    const raw = localStorage.getItem('fakeit.achievements');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAchievements(ids: string[]): void {
  try {
    localStorage.setItem('fakeit.achievements', JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/**
 * Calculates current level and XP info from total XP.
 * Curve: Each level L requires L * 500 XP to level up.
 * Level 1: 0 to 500 XP
 * Level 2: 500 to 1500 XP
 * Level 3: 1500 to 3000 XP
 */
export function getXPLevelInfo(totalXP: number): LevelInfo {
  let level = 1;
  let xpLeft = totalXP;
  while (true) {
    const needed = level * 500;
    if (xpLeft >= needed) {
      xpLeft -= needed;
      level++;
    } else {
      break;
    }
  }
  const nextLevelXP = level * 500;
  const percent = nextLevelXP > 0 ? (xpLeft / nextLevelXP) * 100 : 0;
  return {
    level,
    currentXP: xpLeft,
    nextLevelXP,
    percent,
  };
}

export interface LogMatchParams {
  deckId: string;
  playerCount: number;
  imposters: string[];
  votedOut: string | null;
  winner: 'imposter' | 'crew';
  playerWasImposter: boolean;
  votedCorrectly: boolean;
  roundDuration: number;
  currentLang: string;
}

export interface LogMatchResult {
  xpEarned: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newlyUnlockedAchievements: string[];
}

export function logMatchResult(params: LogMatchParams): LogMatchResult {
  // 1. Calculate XP Earned
  // Base XP: +100 for playing
  let xpEarned = 100;
  
  if (params.playerWasImposter) {
    if (params.winner === 'imposter') {
      xpEarned += 200; // Imposter wins
    }
  } else {
    if (params.winner === 'crew') {
      xpEarned += 100; // Crew wins
    }
    if (params.votedCorrectly) {
      xpEarned += 50; // Voted correctly
    }
  }

  // 2. Load and Update XP
  const oldXP = loadXP();
  const newXP = oldXP + xpEarned;
  saveXP(newXP);

  const oldLevelInfo = getXPLevelInfo(oldXP);
  const newLevelInfo = getXPLevelInfo(newXP);
  const leveledUp = newLevelInfo.level > oldLevelInfo.level;

  // 3. Save Match Record
  const history = loadMatchHistory();
  const record: MatchRecord = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    deckId: params.deckId,
    playerCount: params.playerCount,
    imposters: params.imposters,
    votedOut: params.votedOut,
    winner: params.winner,
    playerWasImposter: params.playerWasImposter,
    xpEarned,
  };
  const updatedHistory = [record, ...history].slice(0, 50); // Keep last 50 matches
  saveMatchHistory(updatedHistory);

  // 4. Check & Unlock Achievements
  const unlocked = loadAchievements();
  const newlyUnlockedAchievements: string[] = [];

  const checkAndUnlock = (id: string, condition: boolean) => {
    if (condition && !unlocked.includes(id)) {
      unlocked.push(id);
      newlyUnlockedAchievements.push(id);
    }
  };

  // Sherlock: Vote the Imposter correctly 3 games in a row
  // We can look at the last 3 matches in our updated history.
  // Note that since we're playing on one device, "voted correctly" means the crew caught the imposter.
  if (updatedHistory.length >= 3) {
    const lastThreeCaught = updatedHistory.slice(0, 3).every(m => {
      // Crew won means the imposter was caught.
      return m.winner === 'crew';
    });
    checkAndUnlock('sherlock', lastThreeCaught);
  }

  // Deception Master: Win as Imposter without receiving a single vote
  // (i.e. winner is imposter, meaning the votedOut player is not in the imposter list)
  const isDeception = params.winner === 'imposter' && params.votedOut !== null && !params.imposters.includes(params.votedOut);
  checkAndUnlock('deception', isDeception);

  // Double Agent: Play 5 games as Imposter
  const imposterGamesCount = updatedHistory.filter(m => m.playerWasImposter).length;
  checkAndUnlock('double_agent', imposterGamesCount >= 5);

  // Night Owl: Play a game after 10:00 PM
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;
  checkAndUnlock('night_owl', isNight);

  // Polyglot: Play a game in Romanian language
  checkAndUnlock('polyglot', params.currentLang === 'ro');

  // Hardcore: Play a game with timer duration under 60 seconds
  checkAndUnlock('hardcore', params.roundDuration < 60);

  if (newlyUnlockedAchievements.length > 0) {
    saveAchievements(unlocked);
  }

  return {
    xpEarned,
    leveledUp,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
    newlyUnlockedAchievements,
  };
}

export function triggerPolyglotAchievement(): string[] {
  const unlocked = loadAchievements();
  if (!unlocked.includes('polyglot')) {
    unlocked.push('polyglot');
    saveAchievements(unlocked);
    return ['polyglot'];
  }
  return [];
}
