import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';
import { AvatarImg } from './AvatarImg';

function CrewGlyph() {
  return (
    <div className="crew" aria-hidden="true">
      <div className="person l" />
      <div className="person r" />
      <div className="person c" />
    </div>
  );
}

function SpyGlyph() {
  return (
    <div className="spy" aria-hidden="true">
      <div className="crown" />
      <div className="brim" />
      <div className="eye l" />
      <div className="eye r" />
      <div className="bridge" />
    </div>
  );
}

export function RevealScreen() {
  const { players, game, settings, advanceReveal, setScreen } = useGameStore();
  const t = useStrings();

  // Hooks must run unconditionally — declare before any early return.
  const [revealed, setRevealed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [prog, setProg] = useState(0);
  const drag = useRef<{ y: number } | null>(null);
  const progRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const RANGE = 260;        // px of upward travel to fully open
  const THRESHOLD = 0.25;   // open past this → counts as "revealed"

  // Preload all player avatars on first render so images are cached
  // before any screen transition needs them.
  useEffect(() => {
    if (!game) return;
    game.playersInfo.forEach((p) => {
      const img = new Image();
      img.src = p.avatar;
    });
  }, [game]);

  // Cleanup pointer capture on unmount to prevent stuck pointer on rapid navigation.
  useEffect(() => {
    return () => {
      if (pointerIdRef.current !== null && screenRef.current) {
        try {
          screenRef.current.releasePointerCapture(pointerIdRef.current);
        } catch {
          /* capture may already be released — ignore */
        }
      }
    };
  }, []);

  if (!game) return null;

  const i = game.turn;
  const isLast = i >= players.length - 1;
  const info = game.playersInfo[i];
  const player = info.name;
  const avatar = info.avatar;
  const theme = info.theme;
  const isImposter = game.imposters.includes(i);
  const nextName = isLast ? null : game.playersInfo[i + 1].name;

  const setP = (p: number) => {
    progRef.current = p;
    setProg(p);
  };

  // ── Hold-to-peek gesture ──────────────────────────────────────────
  // Pointer down anywhere (except action buttons) starts the peek; the
  // drawer follows the pointer while held, and snaps shut on release.
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { y: e.clientY };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const p = Math.max(0, Math.min(1, dy / RANGE));
    setP(p);
    if (p > THRESHOLD && !revealed) {
      setRevealed(true);
      navigator.vibrate?.(20); // subtle haptic on reveal (guarded)
    }
  };

  // Release → always auto-close back down to translateY(103%).
  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    pointerIdRef.current = null;
    drag.current = null;
    setDragging(false);
    if (progRef.current > THRESHOLD) setRevealed(true);
    setP(0);
  };

  const peeking = prog > 0.02;

  const drawerStyle: React.CSSProperties = {
    transform: `translateY(${((1 - prog) * 103).toFixed(2)}%)`,
    transition: dragging
      ? 'none'
      : 'transform 0.42s cubic-bezier(0.22, 0.9, 0.3, 1.05)',
  };

  const handleContinue = () => {
    setRevealed(false);
    setP(0);
    if (isLast) {
      setScreen('starter');
    } else {
      advanceReveal();
    }
  };

  return (
    <div
      className="screen reveal"
      style={{ background: theme.bg }}
      ref={screenRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <header className="hdr" style={{ minHeight: 54, padding: '20px 20px 0' }}>
        <button
          className="hdr-btn left dark"
          aria-label={t.back}
          onClick={() => setScreen('settings')}
        >
          <FIIcon name="chevronLeft" size={30} strokeWidth={3} />
        </button>
      </header>

      <h2 className="reveal-name">{player}</h2>

      <div className="reveal-hero">
        <div className="hero-blob" style={{ background: theme.blob }} />
        <AvatarImg src={avatar} alt={player} className="hero-avatar-img" />
      </div>

      {/* Footer in normal flow so it never overlaps the avatar. The drawer
          (absolute) still slides over it while peeking. */}
      <div className="reveal-foot">
        {!revealed && (
          /* Swipe hint — non-interactive so the drag surface captures the pointer */
          <div className="reveal-hint" style={{ pointerEvents: 'none', opacity: peeking ? 0 : 1 }}>
            <span className="txt">{t.holdPeek}</span>
            <span className="bounce">
              <FIIcon name="chevronUp" size={34} strokeWidth={3} />
            </span>
          </div>
        )}

        {revealed && (
          <div className="pass-block" style={{ opacity: peeking ? 0 : 1 }}>
            {isLast ? (
              <>
                <p className="pass-txt">{t.readyStart}</p>
                <button className="btn-black" onClick={() => setScreen('starter')}>
                  {t.startGame}
                </button>
              </>
            ) : (
              <>
                <p className="pass-txt">{t.passPhone(nextName ?? '')}</p>
                <button className="btn-black" onClick={handleContinue}>
                  {t.continueBtn}
                </button>
              </>
            )}
            <span className="peek-again">{t.peekAgain}</span>
          </div>
        )}
      </div>

      <div className="drawer" style={drawerStyle}>
        <div className="drawer-handle" />
        {isImposter && settings.gameMode !== 'undercover' ? (
          /* Classic mode: imposters see a red IMPOSTER label + hint */
          <>
            <SpyGlyph />
            <p className="imposter-word">{t.imposterWord}</p>
            {settings.hints && <p className="hint-line">{t.hintLine(game.hint)}</p>}
          </>
        ) : isImposter && settings.gameMode === 'undercover' ? (
          /* Undercover mode: card looks identical to Crew — same glyph, same
             font, same color — so no one can tell by peeking. */
          <>
            <CrewGlyph />
            <p className="word">{game.undercoverWord}</p>
            {settings.hints && <p className="hint-line">{t.hintLine(game.undercoverHint)}</p>}
          </>
        ) : (
          <>
            <CrewGlyph />
            <p className="word">{game.word}</p>
          </>
        )}
      </div>
    </div>
  );
}
