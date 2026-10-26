import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { THEME_NAMES, type ThemeName } from '../store/gameStore';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';

const THEME_META: Record<ThemeName, { label: string; a: string; b: string }> = {
  sunset: { label: 'Sunset', a: '#F8262E', b: '#FF2E7E' },
  cyberpunk: { label: 'Cyberpunk', a: '#8E2DE2', b: '#4A00E0' },
  forest: { label: 'Forest', a: '#11998e', b: '#38ef7d' },
  midnight: { label: 'Midnight', a: '#0F2027', b: '#203A43' },
};

function TweaksPanel({ onClose }: { onClose: () => void }) {
  const { themeName, gridVisible, bgMode, setTheme, toggleGrid, toggleBg } = useGameStore();
  const t = useStrings();

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{t.appearance}</h2>

        <section className="tweak-group">
          <h3>{t.theme}</h3>
          <div className="theme-grid">
            {THEME_NAMES.map((t) => {
              const m = THEME_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  className={`theme-opt${themeName === t ? ' on' : ''}`}
                  aria-pressed={themeName === t}
                  onClick={() => setTheme(t)}
                >
                  <span
                    className="theme-bubble"
                    style={{ background: `linear-gradient(135deg, ${m.a}, ${m.b})` }}
                  />
                  <span className="theme-label">{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="tweak-group">
          <h3>{t.bgGrid}</h3>
          <div className="seg">
            <button className={gridVisible ? '' : 'on'} onClick={() => { if (gridVisible) toggleGrid(); }}>
              {t.hide}
            </button>
            <button className={gridVisible ? 'on' : ''} onClick={() => { if (!gridVisible) toggleGrid(); }}>
              {t.show}
            </button>
          </div>
        </section>

        <section className="tweak-group">
          <h3>{t.cardBg}</h3>
          <div className="seg">
            <button className={bgMode === 'black' ? 'on' : ''} onClick={() => { if (bgMode !== 'black') toggleBg(); }}>
              {t.pureBlack}
            </button>
            <button className={bgMode === 'ink' ? 'on' : ''} onClick={() => { if (bgMode !== 'ink') toggleBg(); }}>
              {t.deepInk}
            </button>
          </div>
        </section>

        <button className="btn-white sheet-done" onClick={onClose}>
          {t.done}
        </button>
      </div>
    </div>
  );
}

export function SetupScreen() {
  const [name, setName] = useState('');
  const [flash, setFlash] = useState(false);
  const [nameFlash, setNameFlash] = useState(false);
  const [tweaks, setTweaks] = useState(false);
  const { players, addPlayer, removePlayer, setScreen, setSettingsFrom, setShowStats } = useGameStore();
  const t = useStrings();
  const canPlay = players.length >= 3;

  const handleAdd = () => {
    const v = name.trim();
    if (!v) {
      setNameFlash(true);
      setTimeout(() => setNameFlash(false), 1600);
      return;
    }
    addPlayer(v);
    setName('');
  };

  const handleContinue = () => {
    if (canPlay) {
      setScreen('category');
      return;
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  };

  return (
    <div className="screen lobby">
      <header className="hdr">
        <h1>{t.players}</h1>
        <button
          className="hdr-btn left"
          aria-label={t.tweaksAria}
          onClick={() => setTweaks(true)}
        >
          <FIIcon name="sliders" size={26} strokeWidth={2.4} />
        </button>
        <div className="hdr-right-group">
          <button
            className="hdr-btn"
            aria-label={t.stats}
            onClick={() => setShowStats(true)}
          >
            <FIIcon name="chart" size={26} strokeWidth={2.4} />
          </button>
          <button
            className="hdr-btn"
            aria-label={t.settingsAria}
            onClick={() => {
              setSettingsFrom('setup');
              setScreen('settings');
            }}
          >
            <FIIcon name="gear" size={27} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="scroll">
        {players.map((p, i) => (
          <div className="pill" key={p}>
            <span className="pname">{p}</span>
            <button className="del" aria-label={t.removePlayer(p)} onClick={() => removePlayer(i)}>
              <FIIcon name="x" size={26} strokeWidth={3} />
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            className="add-input"
            placeholder={t.enterName}
            value={name}
            maxLength={18}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button className="add-btn" aria-label={t.addPlayer} onClick={handleAdd}>
            <FIIcon name="plus" size={32} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {flash && <div className="lock-toast">{t.needPlayers}</div>}
      {nameFlash && <div className="lock-toast">{t.emptyName}</div>}

      <button className={`cta-bar${canPlay ? '' : ' disabled'}`} onClick={handleContinue}>
        <span className="cta-main">{t.continue}</span>
        <span className="cta-div" />
        <span className="cta-sub">{t.playerCount(players.length)}</span>
      </button>

      {tweaks && <TweaksPanel onClose={() => setTweaks(false)} />}
    </div>
  );
}
