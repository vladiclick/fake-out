/* eslint-disable react-refresh/only-export-components --
   This store file intentionally co-exports the GameProvider component and the
   useGameStore hook; splitting them would fragment the store with no runtime gain. */
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { AVATARS, DECKS, PLAYER_THEMES, getRandomWord, shuffle } from '../data/words';
import { loadXP, triggerPolyglotAchievement } from '../utils/stats';

export interface PlayerInfo {
  name: string;
  avatar: string;
  theme: { bg: string; blob: string };
}

export type Screen =
  | 'setup'
  | 'category'
  | 'settings'
  | 'reveal'
  | 'starter'
  | 'timer'
  | 'voting'
  | 'momentOfTruth'
  | 'results';

export type GameMode = 'classic' | 'undercover';
export type TimerType = 'freeform' | 'turn';

export interface GameSettings {
  imposters: number;
  duration: number;
  hints: boolean;
  lang: string;
  gameMode: GameMode;
  timerType: TimerType;
  blitz: boolean;
}

export interface GameState {
  word: string;
  hint: string;
  /** Undercover word — only used when gameMode === 'undercover'. */
  undercoverWord: string;
  /** Undercover hint — only used when gameMode === 'undercover'. */
  undercoverHint: string;
  imposters: number[];
  starter: string;
  /** Reveal-phase turn (which player is peeking). */
  turn: number;
  votedFor: number | null;
  /** Per-player info (name + avatar + theme), locked for the whole game. */
  playersInfo: PlayerInfo[];
  /** Turn-by-turn discussion order (shuffled player indices). */
  turnOrder: number[];
  /** Index into turnOrder for the current speaker. */
  currentSpeaker: number;
  /** Indices (into players array) of players who have spoken. */
  spokenPlayers: number[];
}

export type ThemeName = 'sunset' | 'cyberpunk' | 'forest' | 'midnight';
export const THEME_NAMES: ThemeName[] = ['sunset', 'cyberpunk', 'forest', 'midnight'];
export type BgMode = 'black' | 'ink';

interface AppState {
  screen: Screen;
  players: string[];
  settings: GameSettings;
  deckId: string;
  settingsFrom: Screen;
  showInfo: boolean;
  showStats: boolean;
  totalXP: number;
  game: GameState | null;
  // ── Appearance customization ──
  themeName: ThemeName;
  gridVisible: boolean;
  bgMode: BgMode;
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; index: number }
  | { type: 'SET_SETTINGS'; settings: GameSettings }
  | { type: 'SET_DECK'; deckId: string }
  | { type: 'SET_SETTINGS_FROM'; from: Screen }
  | { type: 'SET_SHOW_INFO'; show: boolean }
  | { type: 'SET_SHOW_STATS'; show: boolean }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'START_GAME' }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'SET_TURN'; turn: number }
  | { type: 'SET_VOTE'; index: number }
  | { type: 'SET_THEME'; theme: ThemeName }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_BG' }
  | { type: 'NEXT_SPEAKER' }
  | { type: 'RESET' };

function loadPlayers(): string[] {
  const fallback: string[] = [];
  try {
    const raw = localStorage.getItem('fakeit.players');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(p => typeof p === 'string')) {
      return parsed;
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return fallback;
}

function loadSettings(): GameSettings {
  const fallback: GameSettings = {
    imposters: 1,
    duration: 120,
    hints: true,
    lang: 'en',
    gameMode: 'classic',
    timerType: 'freeform',
    blitz: false,
  };
  try {
    const raw = localStorage.getItem('fakeit.settings');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.imposters === 'number' &&
      typeof parsed.duration === 'number' &&
      typeof parsed.hints === 'boolean' &&
      typeof parsed.lang === 'string'
    ) {
      // Migrate older settings that lack the new fields.
      return {
        ...fallback,
        ...parsed,
      };
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return fallback;
}

function loadDeckId(): string {
  const fallback = 'party';
  try {
    const raw = localStorage.getItem('fakeit.deck');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') {
        return parsed;
      }
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return fallback;
}

function loadTheme(): ThemeName {
  try {
    const raw = localStorage.getItem('fakeit.theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && (THEME_NAMES as string[]).includes(parsed)) {
        return parsed as ThemeName;
      }
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return 'sunset';
}

function loadGridVisible(): boolean {
  try {
    const raw = localStorage.getItem('fakeit.grid');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'boolean') return parsed;
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return true;
}

function loadBgMode(): BgMode {
  try {
    const raw = localStorage.getItem('fakeit.bg');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed === 'black' || parsed === 'ink') return parsed;
    }
  } catch {
    /* corrupt localStorage — fall back to defaults */
  }
  return 'ink';
}

function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* noop */
  }
}

/** Pick two different words from the same deck. */
function pickUndercoverPair(deck: (typeof DECKS)[0], lang: string) {
  const { word: w1, hint: h1, wordObj: o1 } = getRandomWord(deck, lang);
  // Try up to 50 times to find a different word; fall back to index-wrapping.
  for (let attempt = 0; attempt < 50; attempt++) {
    const { word: w2, hint: h2, wordObj: o2 } = getRandomWord(deck, lang);
    if (o2.w !== o1.w) {
      return { word: w1, hint: h1, undercoverWord: w2, undercoverHint: h2 };
    }
  }
  // Fallback: pick the next word in the deck (wrap around).
  const idx = deck.words.findIndex(x => x.w === o1.w);
  const fallback = deck.words[(idx + 1) % deck.words.length];
  const ro = lang === 'ro';
  return {
    word: w1,
    hint: h1,
    undercoverWord: ro && fallback.wro ? fallback.wro : fallback.w,
    undercoverHint: ro && fallback.hro ? fallback.hro : fallback.h,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'ADD_PLAYER': {
      const trimmed = action.name.trim();
      if (!trimmed) return state;
      if (state.players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return state;
      const players = [...state.players, trimmed];
      save('fakeit.players', players);
      return { ...state, players };
    }

    case 'REMOVE_PLAYER': {
      if (action.index < 0 || action.index >= state.players.length) return state;
      const players = state.players.filter((_, j) => j !== action.index);
      save('fakeit.players', players);
      return { ...state, players };
    }

    case 'SET_SETTINGS': {
      save('fakeit.settings', action.settings);
      if (action.settings.lang === 'ro') {
        triggerPolyglotAchievement();
      }
      return { ...state, settings: action.settings };
    }

    case 'SET_DECK': {
      save('fakeit.deck', action.deckId);
      return { ...state, deckId: action.deckId };
    }

    case 'SET_SETTINGS_FROM':
      return { ...state, settingsFrom: action.from };

    case 'SET_SHOW_INFO':
      return { ...state, showInfo: action.show, showStats: false };

    case 'SET_SHOW_STATS':
      return { ...state, showStats: action.show, showInfo: false };

    case 'ADD_XP':
      return { ...state, totalXP: state.totalXP + action.amount };

    case 'START_GAME': {
      // Safety: require at least 2 players (1 imposter + 1 crew).
      if (state.players.length < 2) return state;
      const maxImposters = Math.floor((state.players.length - 1) / 2);
      if (state.settings.imposters < 1 || state.settings.imposters > maxImposters) return state;
      const deck = DECKS.find((d) => d.id === state.deckId) || DECKS[0];
      const nImp = state.settings.imposters;

      // Fresh randomized avatar + theme per game.
      const avatarPool = shuffle(AVATARS);
      const themePool = shuffle(PLAYER_THEMES);
      const playersInfo: PlayerInfo[] = state.players.map((name, idx) => ({
        name,
        avatar: avatarPool[idx % avatarPool.length],
        theme: themePool[idx % themePool.length],
      }));

      // Single shuffled index array: first nImp are imposters, rest is turnOrder.
      const shuffled = shuffle(state.players.map((_, i) => i));
      const imposters = shuffled.slice(0, nImp);
      const turnOrder = shuffled;

      const baseGame = {
        imposters,
        starter: state.players[Math.floor(Math.random() * state.players.length)],
        turn: 0,
        votedFor: null,
        playersInfo,
        turnOrder,
        currentSpeaker: 0,
        spokenPlayers: [] as number[],
      };

      if (state.settings.gameMode === 'undercover') {
        const pair = pickUndercoverPair(deck, state.settings.lang);
        return {
          ...state,
          screen: 'reveal',
          game: {
            ...baseGame,
            word: pair.word,
            hint: pair.hint,
            undercoverWord: pair.undercoverWord,
            undercoverHint: pair.undercoverHint,
          },
        };
      }

      // Classic mode
      const { word, hint } = getRandomWord(deck, state.settings.lang);
      return {
        ...state,
        screen: 'reveal',
        game: {
          ...baseGame,
          word,
          hint,
          undercoverWord: '',
          undercoverHint: '',
        },
      };
    }

    case 'ADVANCE_REVEAL': {
      if (!state.game) return state;
      const nextTurn = state.game.turn + 1;
      if (nextTurn >= state.game.playersInfo.length) {
        return { ...state, screen: 'starter', game: { ...state.game, turn: nextTurn } };
      }
      return { ...state, game: { ...state.game, turn: nextTurn } };
    }

    case 'SET_TURN': {
      if (!state.game) return state;
      return { ...state, game: { ...state.game, turn: action.turn } };
    }

    case 'SET_VOTE': {
      if (!state.game) return state;
      if (state.screen !== 'voting') return state;
      if (action.index < 0 || action.index >= state.game.playersInfo.length) return state;
      return {
        ...state,
        screen: 'momentOfTruth',
        game: { ...state.game, votedFor: action.index },
      };
    }

    case 'NEXT_SPEAKER': {
      if (!state.game) return state;
      // Guard: don't advance past the last speaker.
      if (state.game.currentSpeaker >= state.game.turnOrder.length) return state;
      const currentPlayerIdx = state.game.turnOrder[state.game.currentSpeaker];
      const spokenPlayers = state.game.spokenPlayers.includes(currentPlayerIdx)
        ? state.game.spokenPlayers
        : [...state.game.spokenPlayers, currentPlayerIdx];
      const nextSpeaker = state.game.currentSpeaker + 1;
      return {
        ...state,
        game: { ...state.game, currentSpeaker: nextSpeaker, spokenPlayers },
      };
    }

    case 'SET_THEME': {
      save('fakeit.theme', action.theme);
      return { ...state, themeName: action.theme };
    }

    case 'TOGGLE_GRID': {
      const gridVisible = !state.gridVisible;
      save('fakeit.grid', gridVisible);
      return { ...state, gridVisible };
    }

    case 'TOGGLE_BG': {
      const bgMode: BgMode = state.bgMode === 'ink' ? 'black' : 'ink';
      save('fakeit.bg', bgMode);
      return { ...state, bgMode };
    }

    case 'RESET':
      return { ...state, screen: 'category', game: null, showInfo: false };

    default:
      return state;
  }
}

const initialAppState: AppState = {
  screen: 'setup',
  players: loadPlayers(),
  settings: loadSettings(),
  deckId: loadDeckId(),
  settingsFrom: 'setup',
  showInfo: false,
  showStats: false,
  totalXP: loadXP(),
  game: null,
  themeName: loadTheme(),
  gridVisible: loadGridVisible(),
  bgMode: loadBgMode(),
};

interface GameContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialAppState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

// ── The game store hook (swappable with Zustand's useGameStore) ──

export function useGameStore(): ReturnType<typeof makeSnapshot>;
export function useGameStore<T>(selector: (snap: ReturnType<typeof makeSnapshot>) => T): T;
export function useGameStore<T>(selector?: (snap: ReturnType<typeof makeSnapshot>) => T) {
  const { state, dispatch } = useGame();
  const snap = makeSnapshot(state, dispatch);
  return selector ? selector(snap) : snap;
}

function makeSnapshot(state: AppState, dispatch: React.Dispatch<Action>) {
  return {
    screen: state.screen,
    players: state.players,
    settings: state.settings,
    deckId: state.deckId,
    settingsFrom: state.settingsFrom,
    showInfo: state.showInfo,
    showStats: state.showStats,
    totalXP: state.totalXP,
    game: state.game,
    themeName: state.themeName,
    gridVisible: state.gridVisible,
    bgMode: state.bgMode,

    setScreen: (screen: Screen) => dispatch({ type: 'SET_SCREEN', screen }),
    addPlayer: (name: string) => dispatch({ type: 'ADD_PLAYER', name }),
    removePlayer: (index: number) => dispatch({ type: 'REMOVE_PLAYER', index }),
    setSettings: (settings: GameSettings) => dispatch({ type: 'SET_SETTINGS', settings }),
    setDeckId: (deckId: string) => dispatch({ type: 'SET_DECK', deckId }),
    setSettingsFrom: (from: Screen) => dispatch({ type: 'SET_SETTINGS_FROM', from }),
    setShowInfo: (show: boolean) => dispatch({ type: 'SET_SHOW_INFO', show }),
    setShowStats: (show: boolean) => dispatch({ type: 'SET_SHOW_STATS', show }),
    addXp: (amount: number) => dispatch({ type: 'ADD_XP', amount }),
    startGame: () => dispatch({ type: 'START_GAME' }),
    advanceReveal: () => dispatch({ type: 'ADVANCE_REVEAL' }),
    setGameTurn: (turn: number) => dispatch({ type: 'SET_TURN', turn }),
    castVote: (index: number) => dispatch({ type: 'SET_VOTE', index }),
    nextSpeaker: () => dispatch({ type: 'NEXT_SPEAKER' }),
    setTheme: (theme: ThemeName) => dispatch({ type: 'SET_THEME', theme }),
    toggleGrid: () => dispatch({ type: 'TOGGLE_GRID' }),
    toggleBg: () => dispatch({ type: 'TOGGLE_BG' }),
    resetGame: () => dispatch({ type: 'RESET' }),
  };
}
