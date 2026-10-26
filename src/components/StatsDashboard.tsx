import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';
import {
  loadMatchHistory,
  getXPLevelInfo,
  loadAchievements,
  ACHIEVEMENT_DEFS,
} from '../utils/stats';
import { DECKS } from '../data/words';

export function StatsDashboard() {
  const { setShowStats } = useGameStore();
  const t = useStrings();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview');

  // Load latest stats
  const totalXP = useGameStore((s) => s.totalXP);
  const levelInfo = getXPLevelInfo(totalXP);
  const history = loadMatchHistory();
  const unlockedAchievements = loadAchievements();

  // 1. Calculate Stats
  const gamesPlayed = history.length;
  
  const crewWins = history.filter(m => m.winner === 'crew').length;

  const playerWins = history.filter(m => 
    (m.playerWasImposter && m.winner === 'imposter') || 
    (!m.playerWasImposter && m.winner === 'crew')
  ).length;

  const winRate = gamesPlayed > 0 ? Math.round((playerWins / gamesPlayed) * 100) : 0;
  
  // Imposters caught = games where player was crew and crew won
  const impostersCaught = history.filter(m => !m.playerWasImposter && m.winner === 'crew').length;

  // Compute category play counts
  const categoryCounts: Record<string, number> = {};
  history.forEach(m => {
    categoryCounts[m.deckId] = (categoryCounts[m.deckId] || 0) + 1;
  });

  // SVG Donut Calculations
  const donutRadius = 36;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~226.19
  
  // Wins ratio
  const totalCrewWins = history.filter(m => m.winner === 'crew').length;
  const totalImposterWins = history.filter(m => m.winner === 'imposter').length;
  const totalWinsCombined = totalCrewWins + totalImposterWins;
  
  const crewPct = totalWinsCombined > 0 ? totalCrewWins / totalWinsCombined : 0.5;
  const imposterPct = totalWinsCombined > 0 ? totalImposterWins / totalWinsCombined : 0.5;

  const crewStroke = crewPct * donutCircumference;
  const imposterStroke = imposterPct * donutCircumference;

  return (
    <div className="sheet-scrim stats-overlay" onClick={() => setShowStats(false)}>
      <div className="sheet stats-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{t.stats}</h2>

        {/* Tab Buttons */}
        <div className="stats-tabs">
          <button 
            type="button" 
            className={`tab-btn${activeTab === 'overview' ? ' active' : ''}`}
            onClick={() => { setActiveTab('overview'); }}
          >
            {t.statsOverview}
          </button>
          <button 
            type="button" 
            className={`tab-btn${activeTab === 'history' ? ' active' : ''}`}
            onClick={() => { setActiveTab('history'); }}
          >
            {t.statsHistory}
          </button>
          <button 
            type="button" 
            className={`tab-btn${activeTab === 'achievements' ? ' active' : ''}`}
            onClick={() => { setActiveTab('achievements'); }}
          >
            {t.statsAchievements}
          </button>
        </div>

        {/* Tab Content */}
        <div className="stats-tab-content">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="tab-pane fade-in">
              {/* XP Level Card */}
              <div className="stats-card level-card">
                <div className="level-header">
                  <div className="level-badge">Lv {levelInfo.level}</div>
                  <span className="level-xp-label">
                    {t.statsXP(levelInfo.currentXP, levelInfo.nextLevelXP)}
                  </span>
                </div>
                <div className="level-bar-bg">
                  <div 
                    className="level-bar-fill" 
                    style={{ width: `${levelInfo.percent}%` }}
                  />
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="stats-grid">
                <div className="metric-card">
                  <span className="num">{gamesPlayed}</span>
                  <span className="lbl">{t.statsPlayed}</span>
                </div>
                <div className="metric-card">
                  <span className="num">{winRate}%</span>
                  <span className="lbl">{t.statsWinRate}</span>
                </div>
                <div className="metric-card">
                  <span className="num">{crewWins}</span>
                  <span className="lbl">{t.statsCrewWins}</span>
                </div>
                <div className="metric-card">
                  <span className="num">{impostersCaught}</span>
                  <span className="lbl">{t.statsImpostersCaught}</span>
                </div>
              </div>

              {/* Charts Section */}
              {gamesPlayed > 0 ? (
                <div className="charts-container">
                  {/* Donut Win Ratio */}
                  <div className="chart-box donut-box">
                    <h4>{t.statsWinner} Ratio</h4>
                    <div className="donut-wrapper">
                      <svg width="120" height="120" viewBox="0 0 100 100">
                        {/* Background grey circle */}
                        <circle 
                          cx="50" cy="50" r={donutRadius} 
                          fill="transparent" 
                          stroke="rgba(255,255,255,0.05)" 
                          strokeWidth="8"
                        />
                        {/* Crew segments (Green) */}
                        <circle 
                          cx="50" cy="50" r={donutRadius} 
                          fill="transparent" 
                          stroke="var(--color-crew, #38ef7d)" 
                          strokeWidth="9"
                          strokeDasharray={`${crewStroke} ${donutCircumference}`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                        {/* Imposter segment (Red/Magenta) */}
                        <circle 
                          cx="50" cy="50" r={donutRadius} 
                          fill="transparent" 
                          stroke="var(--color-imposter, #ff2e7e)" 
                          strokeWidth="9"
                          strokeDasharray={`${imposterStroke} ${donutCircumference}`}
                          strokeDashoffset={-crewStroke}
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="donut-center">
                        <span className="pct">{Math.round((crewPct) * 100)}%</span>
                        <span className="lbl">Crew</span>
                      </div>
                    </div>
                    <div className="donut-legend">
                      <span className="legend-item"><span className="dot crew" /> Crew: {totalCrewWins}</span>
                      <span className="legend-item"><span className="dot imposter" /> Imposter: {totalImposterWins}</span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart for Categories */}
                  <div className="chart-box bar-box">
                    <h4>Categories Played</h4>
                    <div className="bar-list">
                      {DECKS.map(deck => {
                        const count = categoryCounts[deck.id] || 0;
                        const maxCount = Math.max(...Object.values(categoryCounts), 1);
                        const pct = (count / maxCount) * 100;
                        return (
                          <div className="bar-row" key={deck.id}>
                            <div className="bar-lbl">
                              <span>{deck.art}</span>
                              <span className="bar-name">{deck.title}</span>
                            </div>
                            <div className="bar-track-wrapper">
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="bar-count">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stats-empty-state">
                  <FIIcon name="chart" size={48} strokeWidth={1.5} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p>{t.statsNoMatches}</p>
                </div>
              )}
            </div>
          )}

          {/* MATCH HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="tab-pane fade-in history-pane">
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map(match => {
                    const deck = DECKS.find(d => d.id === match.deckId);
                    const formattedDate = new Date(match.timestamp).toLocaleDateString(
                      undefined, 
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    );
                    const playerWon = (match.playerWasImposter && match.winner === 'imposter') || 
                                     (!match.playerWasImposter && match.winner === 'crew');

                    return (
                      <div className={`history-item ${playerWon ? 'won' : 'lost'}`} key={match.id}>
                        <div className="item-header">
                          <span className="deck-emoji">{deck?.art || '🎲'}</span>
                          <div className="match-info">
                            <span className="deck-title">{deck?.title || match.deckId}</span>
                            <span className="match-date">{formattedDate}</span>
                          </div>
                          <span className={`match-badge ${playerWon ? 'win' : 'lose'}`}>
                            {playerWon ? 'WIN' : 'LOSE'}
                          </span>
                        </div>
                        <div className="item-details">
                          <div className="detail-col">
                            <span className="lbl">{t.statsWinner}</span>
                            <span className="val capitalize">{match.winner}</span>
                          </div>
                          <div className="detail-col">
                            <span className="lbl">Role</span>
                            <span className="val">
                              {match.playerWasImposter ? t.statsPlayerWasImposterLabel : t.statsPlayerWasCrewLabel}
                            </span>
                          </div>
                          <div className="detail-col">
                            <span className="lbl">XP</span>
                            <span className="val XP">+{match.xpEarned}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="stats-empty-state">
                  <FIIcon name="chart" size={48} strokeWidth={1.5} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p>{t.statsNoMatches}</p>
                </div>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <div className="tab-pane fade-in achievements-pane">
              <div className="achievements-grid">
                {ACHIEVEMENT_DEFS.map(def => {
                  const isUnlocked = unlockedAchievements.includes(def.id);
                  // Use translated keys
                  const title = t[def.titleKey as keyof typeof t] as string || def.id;
                  const desc = t[def.descKey as keyof typeof t] as string || '';

                  return (
                    <div className={`ach-card${isUnlocked ? ' unlocked' : ' locked'}`} key={def.id}>
                      <div className="ach-icon">{def.emoji}</div>
                      <div className="ach-text">
                        <span className="ach-title">{title}</span>
                        <span className="ach-desc">{desc}</span>
                      </div>
                      {isUnlocked && <span className="ach-unlocked-badge"><FIIcon name="check" size={16} strokeWidth={3} /></span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        <button type="button" className="btn-white sheet-done" onClick={() => { setShowStats(false); }}>
          {t.done}
        </button>
      </div>
    </div>
  );
}
