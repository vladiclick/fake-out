import { useGameStore } from './store/gameStore';

export type Lang = 'en' | 'ro';

const en = {
  // Setup
  players: 'Players',
  enterName: 'Enter player name',
  continue: 'CONTINUE',
  playerCount: (n: number) => `${n} ${n === 1 ? 'Player' : 'Players'}`,
  needPlayers: 'Add at least 3 players to start',
  emptyName: 'Please enter a name',
  removePlayer: (name: string) => `Remove ${name}`,
  addPlayer: 'Add player',
  tweaksAria: 'Appearance tweaks',
  settingsAria: 'Game settings',
  playersAria: 'Players',
  howToPlayAria: 'How to play',
  back: 'Back',

  // Tweaks panel
  appearance: 'Appearance',
  theme: 'Theme',
  bgGrid: 'Background grid',
  hide: 'Hide',
  show: 'Show',
  cardBg: 'Card background',
  pureBlack: 'Pure Black',
  deepInk: 'Deep Ink',
  done: 'Done',

  // Settings
  gameSettings: 'Game Settings',
  imposters: 'Imposters',
  impostersDesc: 'How many players should be secret imposters?',
  recommended: (n: number, r: number) => `Recommended for ${n} players: ${r}`,
  roundDuration: 'Round Duration',
  roundDesc: 'How long should each discussion round last?',
  hintsTitle: 'Hints for Imposters',
  hintsDesc: 'Should imposters get a hint about the secret word?',
  disabled: 'Disabled',
  enabled: 'Enabled',
  language: 'Language',
  languageDesc: 'Which language should the words be in?',
  play: 'PLAY',
  imposterCount: (n: number) => `${n} ${n === 1 ? 'Imposter' : 'Imposters'}`,

  // Game Mode
  gameMode: 'Game Mode',
  classicMode: 'Classic',
  undercoverMode: 'Undercover',
  discussionStyle: 'Discussion Style',
  freeform: 'Free-form',
  turnByTurn: 'Turn-by-turn',
  blitzMode: 'Blitz Mode (15s)',
  blitzDesc: 'Each player gets only 15 seconds to describe',
  undercoverModeDesc: 'Imposter gets a related word instead of blank',
  classicModeDesc: 'Imposter gets no word, only a hint',
  turnByTurnDesc: 'Players describe one by one in a hot seat',
  freeformDesc: 'Everyone discusses freely until the timer runs out',
  congrats: '🎉 Congratulations! 🎉',

  // Turn Tracker
  nextPlayer: 'Next Player',
  clueGiven: 'Clue Given',
  speaking: 'Speaking...',
  pending: 'Pending',
  turnsLeft: (n: number) => `${n} turn${n === 1 ? '' : 's'} left`,

  // Reveal
  holdPeek: 'Hold & swipe up to peek at your word',
  passPhone: (name: string) => `Pass the phone to ${name}`,
  continueBtn: 'Continue',
  readyStart: 'Ready to start the game!',
  startGame: 'Start Game',
  peekAgain: 'Hold to peek again',
  imposterWord: 'IMPOSTER',
  undercoverLabel: 'UNDERCOVER',
  hintLine: (h: string) => `Hint: ${h}`,

  // Starter (who goes first)
  starterEyebrow: 'Everyone has their word',
  starterStarts: 'starts the round',
  starterInstruction:
    'Describe the secret word out loud — without ever saying it. Then keep going clockwise.',
  starterBtn: 'Start the round',

  // Timer
  pause: 'Pause',
  resume: 'Resume',
  skipVoting: 'Skip to voting',
  voteNow: 'Vote now',
  timeUp: "Time's up!",

  // Voting
  whoImposter: "Who's the Imposter?",
  discussVote: 'Discuss, then vote for who you think is faking it',
  voteFor: (name: string) => `Vote for ${name}`,
  lockItIn: 'LOCK IT IN',

  // Moment of truth
  motLines: ['THE', 'MOMENT', 'OF TRUTH'],
  tapReveal: 'Tap to reveal',

  // Results
  results: 'Results',
  playersWin: 'Players Win!',
  imposterWins: 'Imposter Wins!',
  undercoverWins: 'Undercover Wins!',
  caughtSub: 'The Imposter was successfully caught!',
  gotAwaySub: 'The Imposter got away undetected',
  undercoverCaughtSub: 'The Undercover was successfully caught!',
  undercoverGotAwaySub: 'The Undercover got away undetected',
  allImposters: (names: string) => `All imposters: ${names}`,
  allUndercover: (names: string) => `All undercover: ${names}`,
  secretWord: 'Secret Word',
  undercoverWordLabel: 'Undercover Word',
  playAgain: 'PLAY AGAIN',

  // Info modal
  howToTitle: 'How to play',
  howToP1:
    'Everyone gets the same secret word — except the imposters, who only get a vague hint (if enabled).',
  howToP2:
    'Pass the phone around so each player can secretly check their word. Then talk! Take turns describing the word without giving it away.',
  howToP3: 'When the timer runs out, vote: who was faking it the whole time?',
  gotIt: 'Got it',

  // Stats & Achievements
  stats: 'Statistics',
  statsOverview: 'Overview',
  statsHistory: 'History',
  statsAchievements: 'Badges',
  statsLevel: (n: number) => `Level ${n}`,
  statsXP: (curr: number, next: number) => `${curr} / ${next} XP`,
  statsPlayed: 'Games Played',
  statsWinRate: 'Win Rate',
  statsCrewWins: 'Crew Wins',
  statsImpostersCaught: 'Imposters Caught',
  statsMatchHistory: 'Match History',
  statsWinner: 'Winner',
  statsDate: 'Date',
  statsNoMatches: 'No matches logged yet. Play a game!',
  statsImposterLabel: 'Imposters',
  statsVotedOutLabel: 'Voted Out',
  statsXpEarnedLabel: 'XP Earned',
  statsPlayerWasImposterLabel: 'As Imposter',
  statsPlayerWasCrewLabel: 'As Crew',
  xpGainedToast: (xp: number) => `+${xp} XP Gained!`,
  levelUpToast: (lvl: number) => `LEVEL UP! Level ${lvl}`,
  newAchievementToast: (title: string) => `Unlocked Badge: ${title}`,

  // Achievements Details
  achSherlockTitle: 'Sherlock',
  achSherlockDesc: 'Vote the imposter correctly 3 games in a row.',
  achDeceptionTitle: 'Deception Master',
  achDeceptionDesc: 'Win as Imposter without receiving a single vote.',
  achDoubleAgentTitle: 'Double Agent',
  achDoubleAgentDesc: 'Play 5 games as an Imposter.',
  achNightOwlTitle: 'Night Owl',
  achNightOwlDesc: 'Play a game after 10:00 PM.',
  achPolyglotTitle: 'Romanian Patriot',
  achPolyglotDesc: 'Play a game in Romanian language.',
  achHardcoreTitle: 'Hardcore',
  achHardcoreDesc: 'Play a game with timer duration under 60 seconds.',
};

export type Strings = typeof en;

const ro: Strings = {
  players: 'Jucători',
  enterName: 'Introdu numele jucătorului',
  continue: 'CONTINUĂ',
  playerCount: (n: number) => `${n} ${n === 1 ? 'Jucător' : 'Jucători'}`,
  needPlayers: 'Adaugă cel puțin 3 jucători',
  emptyName: 'Introdu un nume',
  removePlayer: (name: string) => `Șterge ${name}`,
  addPlayer: 'Adaugă jucător',
  tweaksAria: 'Personalizare aspect',
  settingsAria: 'Setări joc',
  playersAria: 'Jucători',
  howToPlayAria: 'Cum se joacă',
  back: 'Înapoi',

  appearance: 'Aspect',
  theme: 'Temă',
  bgGrid: 'Grilă de fundal',
  hide: 'Ascunde',
  show: 'Arată',
  cardBg: 'Fundal carduri',
  pureBlack: 'Negru Pur',
  deepInk: 'Negru Profund',
  done: 'Gata',

  gameSettings: 'Setări Joc',
  imposters: 'Impostori',
  impostersDesc: 'Câți jucători să fie impostori secreți?',
  recommended: (n: number, r: number) => `Recomandat pentru ${n} jucători: ${r}`,
  roundDuration: 'Durata Rundei',
  roundDesc: 'Cât să dureze fiecare rundă de discuții?',
  hintsTitle: 'Indicii pentru Impostori',
  hintsDesc: 'Impostorii primesc un indiciu despre cuvântul secret?',
  disabled: 'Dezactivat',
  enabled: 'Activat',
  language: 'Limbă',
  languageDesc: 'În ce limbă să fie cuvintele?',
  play: 'JOACĂ',
  imposterCount: (n: number) => `${n} ${n === 1 ? 'Impostor' : 'Impostori'}`,

  // Game Mode
  gameMode: 'Mod Joc',
  classicMode: 'Clasic',
  undercoverMode: 'Sub Acoperire',
  discussionStyle: 'Stil Discuție',
  freeform: 'La liber',
  turnByTurn: 'Pe rând',
  blitzMode: 'Mod Blitz (15s)',
  blitzDesc: 'Fiecare jucător are doar 15 secunde să descrie',
  undercoverModeDesc: 'Impostorul primește un cuvânt înrudit în loc de nimic',
  classicModeDesc: 'Impostorul nu primește cuvânt, doar un indiciu',
  turnByTurnDesc: 'Jucătorii descriu pe rând, unul câte unul',
  freeformDesc: 'Toată lumea discută liber până la expirarea timpului',
  congrats: '🎉 Felicitări! 🎉',

  // Turn Tracker
  nextPlayer: 'Următorul',
  clueGiven: 'Indiciu Dat',
  speaking: 'Vorbește...',
  pending: 'În așteptare',
  turnsLeft: (n: number) => `${n} ${n === 1 ? 'tură rămasă' : 'ture rămase'}`,

  holdPeek: 'Ține apăsat și trage în sus ca să vezi cuvântul',
  passPhone: (name: string) => `Dă telefonul lui ${name}`,
  continueBtn: 'Continuă',
  readyStart: 'Gata de joc!',
  startGame: 'Începe Jocul',
  peekAgain: 'Ține apăsat ca să revezi',
  imposterWord: 'IMPOSTOR',
  undercoverLabel: 'SUB ACOPERIRE',
  hintLine: (h: string) => `Indiciu: ${h}`,

  starterEyebrow: 'Toți și-au văzut cuvântul',
  starterStarts: 'începe runda',
  starterInstruction:
    'Descrie cuvântul secret cu voce tare — fără să-l spui vreodată. Apoi continuați în sensul acelor de ceasornic.',
  starterBtn: 'Începe runda',

  pause: 'Pauză',
  resume: 'Reia',
  skipVoting: 'Sari la vot',
  voteNow: 'Votează acum',
  timeUp: 'Timpul a expirat!',

  whoImposter: 'Cine e Impostorul?',
  discussVote: 'Discutați, apoi votați cine credeți că minte',
  voteFor: (name: string) => `Votează pentru ${name}`,
  lockItIn: 'CONFIRMĂ VOTUL',

  motLines: ['MOMENTUL', 'ADEVĂRULUI', ''],
  tapReveal: 'Atinge pentru rezultate',

  results: 'Rezultate',
  playersWin: 'Jucătorii Câștigă!',
  imposterWins: 'Impostorul Câștigă!',
  undercoverWins: 'Sub Acoperire Câștigă!',
  caughtSub: 'Impostorul a fost prins!',
  gotAwaySub: 'Impostorul a scăpat nedetectat',
  undercoverCaughtSub: 'Agentul sub acoperire a fost prins!',
  undercoverGotAwaySub: 'Agentul sub acoperire a scăpat nedetectat',
  allImposters: (names: string) => `Toți impostorii: ${names}`,
  allUndercover: (names: string) => `Toți sub acoperire: ${names}`,
  secretWord: 'Cuvântul Secret',
  undercoverWordLabel: 'Cuvânt Sub Acoperire',
  playAgain: 'JOACĂ DIN NOU',

  howToTitle: 'Cum se joacă',
  howToP1:
    'Toți primesc același cuvânt secret — în afară de impostori, care primesc doar un indiciu vag (dacă e activat).',
  howToP2:
    'Dați telefonul în cerc, ca fiecare jucător să-și vadă cuvântul în secret. Apoi discutați! Pe rând, descrieți cuvântul fără să-l spuneți.',
  howToP3: 'Când timpul expiră, votați: cine a fost impostorul tot timpul?',
  gotIt: 'Am înțeles',

  // Stats & Achievements
  stats: 'Statistici',
  statsOverview: 'General',
  statsHistory: 'Istoric',
  statsAchievements: 'Medalii',
  statsLevel: (n: number) => `Nivelul ${n}`,
  statsXP: (curr: number, next: number) => `${curr} / ${next} XP`,
  statsPlayed: 'Jocuri Jucate',
  statsWinRate: 'Rată Câștig',
  statsCrewWins: 'Câștiguri Echipă',
  statsImpostersCaught: 'Impostori Prinși',
  statsMatchHistory: 'Istoric Meciuri',
  statsWinner: 'Câștigător',
  statsDate: 'Dată',
  statsNoMatches: 'Niciun meci înregistrat. Joacă un joc!',
  statsImposterLabel: 'Impostori',
  statsVotedOutLabel: 'Votat Afară',
  statsXpEarnedLabel: 'XP Câștigat',
  statsPlayerWasImposterLabel: 'Ca Impostor',
  statsPlayerWasCrewLabel: 'Ca Echipă',
  xpGainedToast: (xp: number) => `+${xp} XP Câștigați!`,
  levelUpToast: (lvl: number) => `NIVEL NOU! Nivelul ${lvl}`,
  newAchievementToast: (title: string) => `Medalie deblocată: ${title}`,

  // Achievements Details
  achSherlockTitle: 'Sherlock',
  achSherlockDesc: 'Votați impostorul corect în 3 jocuri consecutive.',
  achDeceptionTitle: 'Maestrul Înșelăciunii',
  achDeceptionDesc: 'Câștigă ca Impostor fără a primi vreun vot.',
  achDoubleAgentTitle: 'Agent Dublu',
  achDoubleAgentDesc: 'Joacă 5 jocuri în rolul de Impostor.',
  achNightOwlTitle: 'Pasăre de Noapte',
  achNightOwlDesc: 'Joacă un meci după ora 22:00.',
  achPolyglotTitle: 'Patriot Român',
  achPolyglotDesc: 'Joacă un meci în limba română.',
  achHardcoreTitle: 'Hardcore',
  achHardcoreDesc: 'Joacă un joc cu cronometrul sub 60 de secunde.',
};

const DICTS: Record<Lang, Strings> = { en, ro };

export function getStrings(lang: string): Strings {
  return lang === 'ro' ? DICTS.ro : DICTS.en;
}

/** Reactive translation hook — re-renders when the language setting changes. */
export function useStrings(): Strings {
  const lang = useGameStore((s) => s.settings.lang);
  return getStrings(lang);
}
