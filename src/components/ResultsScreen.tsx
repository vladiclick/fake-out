import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';
import { AvatarImg } from './AvatarImg';
import { logMatchResult } from '../utils/stats';

export function ResultsScreen() {
  const { game, resetGame, addXp, deckId, settings } = useGameStore();
  const t = useStrings();
  const [toast, setToast] = useState<{ xp: number; isLevelUp: boolean; newLevel: number } | null>(null);
  const [logged, setLogged] = useState(false);

  const isUndercover = settings.gameMode === 'undercover';

  // Runs once on mount to persist the match result, award XP, and show the
  // XP toast. These are intentional one-shot side effects, not render-derived
  // state — so the set-state-in-effect rule is suppressed here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!game || logged) return;

    const voted = game.votedFor;
    const imposterIndices = game.imposters;
    const caught = voted !== null && imposterIndices.includes(voted);

    const winner = caught ? 'crew' : 'imposter';
    const votedOut = voted !== null ? game.playersInfo[voted].name : null;
    const playerWasImposter = imposterIndices.includes(0);
    const votedCorrectly = caught;

    const result = logMatchResult({
      deckId,
      playerCount: game.playersInfo.length,
      imposters: imposterIndices.map((idx) => game.playersInfo[idx].name),
      votedOut,
      winner,
      playerWasImposter,
      votedCorrectly,
      roundDuration: settings.duration,
      currentLang: settings.lang,
    });

    addXp(result.xpEarned);
    setLogged(true);
    setToast({
      xp: result.xpEarned,
      isLevelUp: result.leveledUp,
      newLevel: result.newLevel,
    });

    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [game, logged, deckId, settings, addXp]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!game) return null;

  const voted = game.votedFor;
  const imposterIndices = game.imposters;
  const caught = voted !== null && imposterIndices.includes(voted);

  const imposterNames = imposterIndices.map((i) => game.playersInfo[i].name);
  const imposterLabel = imposterNames.join(' & ');

  const firstImposterIdx = imposterIndices[0];
  const imposterAvatar = game.playersInfo[firstImposterIdx].avatar;
  const imposterName = game.playersInfo[firstImposterIdx].name;

  const winTitle = caught ? t.playersWin : (isUndercover ? t.undercoverWins : t.imposterWins);
  const subText = caught
    ? (isUndercover ? t.undercoverCaughtSub : t.caughtSub)
    : (isUndercover ? t.undercoverGotAwaySub : t.gotAwaySub);
  const allLabel = isUndercover ? t.allUndercover(imposterLabel) : t.allImposters(imposterLabel);

  return (
    <div className="screen results-screen">
      {toast && (
        <div className={`xp-toast ${toast.isLevelUp ? 'levelup' : ''}`}>
          <span className="toast-title">
            {toast.isLevelUp ? t.levelUpToast(toast.newLevel) : t.xpGainedToast(toast.xp)}
          </span>
          {toast.isLevelUp && (
            <span className="toast-msg">{t.congrats}</span>
          )}
        </div>
      )}
      <header className="hdr">
        <h1>{t.results}</h1>
      </header>

      <div className="results-body">
        {/* Outcome card */}
        <div className="results-card outcome-card">
          <p className={`outcome-title ${caught ? 'win' : 'lose'}`}>
            {winTitle}
          </p>
          <p className="outcome-sub">{subText}</p>

          {/* Imposter/Undercover sub-card */}
          <div className="imposter-chip">
            <AvatarImg
              src={imposterAvatar}
              alt={imposterName}
              className="imposter-chip-avatar"
            />
            <p className="imposter-chip-name">{imposterName}</p>
          </div>

          {imposterIndices.length > 1 && (
            <p className="outcome-all-imposters">{allLabel}</p>
          )}
        </div>

        {/* Secret Word card(s) */}
        {isUndercover ? (
          <div className="results-word-pair">
            <div className="results-card word-card">
              <p className="word-label">{t.secretWord}</p>
              <p className="word-value">{game.word}</p>
            </div>
            <div className="results-card word-card">
              <p className="word-label">{t.undercoverWordLabel}</p>
              <p className="word-value">{game.undercoverWord}</p>
            </div>
          </div>
        ) : (
          <div className="results-card word-card">
            <p className="word-label">{t.secretWord}</p>
            <p className="word-value">{game.word}</p>
          </div>
        )}

        {/* Play Again button */}
        <button className="results-play-btn" onClick={resetGame}>
          <FIIcon name="reload" size={22} strokeWidth={3} />
          {t.playAgain}
        </button>
      </div>
    </div>
  );
}
