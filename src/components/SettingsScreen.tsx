import { useGameStore } from '../store/gameStore';
import { formatTime } from '../data/words';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';

export function SettingsScreen() {
  const { players, settings, setSettings, settingsFrom, setScreen, startGame } =
    useGameStore();
  const t = useStrings();

  const maxImp = Math.max(1, Math.floor((players.length - 1) / 2));
  const rec = Math.max(1, Math.round(players.length / 4));
  const imp = Math.min(settings.imposters, maxImp);

  return (
    <div className="screen lobby">
      <header className="hdr">
        <h1>{t.gameSettings}</h1>
        <button
          className="hdr-btn left"
          aria-label={t.back}
          onClick={() => setScreen(settingsFrom)}
        >
          <FIIcon name="chevronLeft" size={30} strokeWidth={3} />
        </button>
      </header>

      <div className="scroll">
        {/* ── Game Mode ── */}
        <div className="set-card">
          <h3>{t.gameMode}</h3>
          <p className="sub">
            {settings.gameMode === 'undercover'
              ? t.undercoverModeDesc
              : t.classicModeDesc}
          </p>
          <div className="seg">
            <button
              className={settings.gameMode === 'classic' ? 'on' : ''}
              onClick={() => setSettings({ ...settings, gameMode: 'classic' })}
            >
              {t.classicMode}
            </button>
            <button
              className={settings.gameMode === 'undercover' ? 'on' : ''}
              onClick={() => setSettings({ ...settings, gameMode: 'undercover' })}
            >
              {t.undercoverMode}
            </button>
          </div>
        </div>

        {/* ── Imposters ── */}
        <div className="set-card">
          <h3>{t.imposters}</h3>
          <p className="sub">{t.impostersDesc}</p>
          <p className="rec">{t.recommended(players.length, rec)}</p>
          <div className="counter">
            <button
              className="cbtn"
              disabled={imp <= 1}
              aria-label="Fewer imposters"
              onClick={() => setSettings({ ...settings, imposters: imp - 1 })}
            >
              <FIIcon name="minus" size={26} strokeWidth={3} />
            </button>
            <span className="cval">{imp}</span>
            <button
              className="cbtn"
              disabled={imp >= maxImp}
              aria-label="More imposters"
              onClick={() => setSettings({ ...settings, imposters: imp + 1 })}
            >
              <FIIcon name="plus" size={26} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── Round Duration ── */}
        <div className="set-card">
          <h3>{t.roundDuration}</h3>
          <p className="sub">{t.roundDesc}</p>
          <div className="counter">
            <button
              className="cbtn"
              disabled={settings.duration <= 30}
              aria-label="Shorter round"
              onClick={() => setSettings({ ...settings, duration: settings.duration - 30 })}
            >
              <FIIcon name="minus" size={26} strokeWidth={3} />
            </button>
            <span className="cval">{formatTime(settings.duration)}</span>
            <button
              className="cbtn"
              disabled={settings.duration >= 600}
              aria-label="Longer round"
              onClick={() => setSettings({ ...settings, duration: settings.duration + 30 })}
            >
              <FIIcon name="plus" size={26} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── Discussion Style ── */}
        <div className="set-card">
          <h3>{t.discussionStyle}</h3>
          <p className="sub">
            {settings.timerType === 'turn'
              ? t.turnByTurnDesc
              : t.freeformDesc}
          </p>
          <div className="seg">
            <button
              className={settings.timerType === 'freeform' ? 'on' : ''}
              onClick={() => setSettings({ ...settings, timerType: 'freeform' })}
            >
              {t.freeform}
            </button>
            <button
              className={settings.timerType === 'turn' ? 'on' : ''}
              onClick={() => setSettings({ ...settings, timerType: 'turn' })}
            >
              {t.turnByTurn}
            </button>
          </div>
        </div>

        {/* ── Blitz Mode (only for turn-by-turn) ── */}
        {settings.timerType === 'turn' && (
          <div className="set-card">
            <h3>{t.blitzMode}</h3>
            <p className="sub">{t.blitzDesc}</p>
            <div className="seg">
              <button
                className={!settings.blitz ? 'on' : ''}
                onClick={() => setSettings({ ...settings, blitz: false })}
              >
                {t.disabled}
              </button>
              <button
                className={settings.blitz ? 'on' : ''}
                onClick={() => setSettings({ ...settings, blitz: true })}
              >
                {t.enabled}
              </button>
            </div>
          </div>
        )}

        {/* ── Hints ── */}
        <div className="set-card">
          <h3>{t.hintsTitle}</h3>
          <p className="sub">{t.hintsDesc}</p>
          <div className="seg">
            <button
              className={settings.hints ? '' : 'on'}
              onClick={() => setSettings({ ...settings, hints: false })}
            >
              {t.disabled}
            </button>
            <button
              className={settings.hints ? 'on' : ''}
              onClick={() => setSettings({ ...settings, hints: true })}
            >
              {t.enabled}
            </button>
          </div>
        </div>

        {/* ── Language ── */}
        <div className="set-card">
          <h3>{t.language}</h3>
          <p className="sub">{t.languageDesc}</p>
          <div className="seg">
            <button
              className={settings.lang === 'ro' ? 'on' : ''}
              onClick={() => setSettings({ ...settings, lang: 'ro' })}
            >
              Română
            </button>
            <button
              className={settings.lang === 'en' || !settings.lang ? 'on' : ''}
              onClick={() => setSettings({ ...settings, lang: 'en' })}
            >
              English
            </button>
          </div>
        </div>
      </div>

      <button className="cta-bar" onClick={() => startGame()}>
        <span className="cta-main">{t.play}</span>
        <span className="cta-div" />
        <span className="cta-sub">{t.imposterCount(imp)}</span>
      </button>
    </div>
  );
}
