import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';

export function MomentOfTruthScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const t = useStrings();
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const reveal = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    window.setTimeout(() => setScreen('results'), 480);
  };

  // Safety auto-advance so the flow never stalls if no tap comes.
  useEffect(() => {
    const id = window.setTimeout(reveal, 4200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`screen mot-screen${leaving ? ' leaving' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={t.tapReveal}
      onClick={reveal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') reveal();
      }}
    >
      <div className="mot-body">
        <h1 className="mot-text">
          <span style={{ animationDelay: '.05s' }}>{t.motLines[0]}</span>
          <span style={{ animationDelay: '.18s' }}>{t.motLines[1]}</span>
          <span style={{ animationDelay: '.31s' }}>{t.motLines[2]}</span>
        </h1>
        <span className="mot-dot" aria-hidden="true" />
      </div>

      <p className="mot-hint">{t.tapReveal}</p>
    </div>
  );
}
