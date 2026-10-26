import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../data/words';
import { FIIcon } from './Icons';
import { Logo } from './Logo';
import { AvatarImg } from './AvatarImg';
import { useStrings } from '../i18n';

const RING_R = 104;
const RING_C = 2 * Math.PI * RING_R;

type WakeSentinel = { release: () => Promise<void> };
type WakeNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeSentinel> };
};

/* ── Freeform timer (classic group countdown) ── */

function FreeformTimer() {
  const { settings, setScreen, setShowInfo } = useGameStore();
  const [left, setLeft] = useState(settings.duration);
  const [paused, setPaused] = useState(false);
  const strs = useStrings();
  const endedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (left <= 0 && !endedRef.current) {
      endedRef.current = true;
      navigator.vibrate?.([120, 60, 120]);
    }
  }, [left]);

  // Wake lock
  useEffect(() => {
    const nav = navigator as WakeNavigator;
    if (!nav.wakeLock) return;
    let sentinel: WakeSentinel | null = null;
    let cancelled = false;
    const request = () => {
      nav.wakeLock!
        .request('screen')
        .then((s) => {
          if (cancelled) s.release().catch(() => {});
          else sentinel = s;
        })
        .catch(() => {});
    };
    request();
    const onVis = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      sentinel?.release().catch(() => {});
    };
  }, []);

  const done = left <= 0;
  const pct = Math.max(0, Math.min(1, left / settings.duration));
  const urgent = !done && left <= 10;

  return (
    <div className="screen timer-screen">
      <header className="hdr" style={{ width: '100%', minHeight: 54, padding: '20px 20px 0' }}>
        <button
          className="hdr-btn left"
          aria-label={strs.back}
          onClick={() => setScreen('settings')}
        >
          <FIIcon name="chevronLeft" size={30} strokeWidth={3} />
        </button>
        <button
          className="hdr-btn right"
          aria-label={strs.howToPlayAria}
          onClick={() => setShowInfo(true)}
        >
          <FIIcon name="info" size={27} strokeWidth={2.4} />
        </button>
      </header>

      <div className="timer-mid">
        <Logo size={52} />
        <div className="timer-ring-wrap">
          <svg className="timer-ring" viewBox="0 0 240 240" aria-hidden="true">
            <circle className="ring-track" cx="120" cy="120" r={RING_R} />
            <circle
              className={`ring-prog${urgent ? ' urgent' : ''}`}
              cx="120"
              cy="120"
              r={RING_R}
              style={{
                strokeDasharray: RING_C,
                strokeDashoffset: RING_C * (1 - pct),
              }}
            />
          </svg>
          <div className="timer-ring-center">
            <p className={`timer-count${done ? ' done' : ''}${urgent ? ' urgent' : ''}`}>
              {done ? strs.timeUp : formatTime(left)}
            </p>
            {paused && !done && <p className="timer-paused">{strs.pause}</p>}
          </div>
        </div>
      </div>

      <div className="timer-foot">
        {done ? (
          <button className="btn-white wide" onClick={() => setScreen('voting')}>
            {strs.voteNow}
          </button>
        ) : (
          <>
            <button className="btn-white wide" onClick={() => setPaused((p) => !p)}>
              {paused ? strs.resume : strs.pause}
            </button>
            <button className="btn-ghost light" onClick={() => setScreen('voting')}>
              {strs.skipVoting}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Turn-by-turn timer ── */

function TurnTimer() {
  const { game, settings, setScreen, nextSpeaker } = useGameStore();
  const t = useStrings();
  const endedRef = useRef(false);
  const clickGuardRef = useRef(false);

  // All hooks MUST be called before any conditional return (Rules of Hooks).
  const speakerIdx = game?.currentSpeaker ?? 0;
  const totalPlayers = game?.turnOrder.length ?? 0;
  const blitz = settings.blitz;
  const perPlayer = blitz ? 15 : settings.duration;

  // Reset the ended sentinel and click guard whenever the speaker changes so the next
  // player gets a fresh countdown instead of an instant expiry.
  useEffect(() => {
    endedRef.current = false;
    clickGuardRef.current = false;
  }, [speakerIdx]);

  if (!game) return null;

  // All players have spoken → auto-transition to voting.
  const allDone = speakerIdx >= totalPlayers;

  // Current speaker's player index.
  const currentPlayerIdx =
    speakerIdx < totalPlayers ? game.turnOrder[speakerIdx] : -1;
  const currentInfo =
    currentPlayerIdx >= 0 ? game.playersInfo[currentPlayerIdx] : null;

  return (
    <div className="screen timer-screen turn-mode">
      <header className="hdr" style={{ width: '100%', minHeight: 54, padding: '20px 20px 0' }}>
        <button
          className="hdr-btn left"
          aria-label={t.back}
          onClick={() => setScreen('settings')}
        >
          <FIIcon name="chevronLeft" size={30} strokeWidth={3} />
        </button>
        <span className="turn-hdr-label">
          {t.turnsLeft(Math.max(0, totalPlayers - speakerIdx))}
        </span>
      </header>

      {allDone ? (
        /* All turns complete → transition */
        <TurnAllDone onVote={() => setScreen('voting')} />
      ) : (
        <>
          {/* Hot seat card — keyed by speaker so it remounts (and resets its
              countdown) on each turn instead of resetting state in an effect. */}
          <TurnHotSeat
            key={currentPlayerIdx}
            info={currentInfo!}
            duration={perPlayer}
            onExpired={() => {
              if (!endedRef.current) {
                endedRef.current = true;
                navigator.vibrate?.(200);
                nextSpeaker();
              }
            }}
          />

          {/* Clue checklist */}
          <TurnChecklist
            playersInfo={game.playersInfo}
            turnOrder={game.turnOrder}
            currentSpeaker={speakerIdx}
            spokenPlayers={game.spokenPlayers}
          />

          {/* Controls */}
          <div className="turn-foot">
            <button
              className="btn-white wide"
              onClick={() => {
                if (clickGuardRef.current) return;
                clickGuardRef.current = true;
                endedRef.current = false;
                nextSpeaker();
              }}
            >
              {t.nextPlayer}
            </button>
            <button
              className="btn-ghost light"
              onClick={() => setScreen('voting')}
            >
              {t.skipVoting}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── All-done interstitial ── */

function TurnAllDone({ onVote }: { onVote: () => void }) {
  const t = useStrings();
  useEffect(() => {
    navigator.vibrate?.([150, 80, 150]);
  }, []);
  return (
    <div className="turn-all-done">
      <Logo size={48} />
      <p className="turn-all-done-text">{t.timeUp}</p>
      <button className="btn-white wide" onClick={onVote}>
        {t.voteNow}
      </button>
    </div>
  );
}

/* ── Hot seat card with per-player countdown ── */

function TurnHotSeat({
  info,
  duration,
  onExpired,
}: {
  info: { name: string; avatar: string; theme: { bg: string; blob: string } };
  duration: number;
  onExpired: () => void;
}) {
  const [left, setLeft] = useState(duration);
  const [paused, setPaused] = useState(false);
  const endedRef = useRef(false);
  const warnedRef = useRef(false);
  const t = useStrings();

  // No reset effect needed: the parent keys this component by speaker, so it
  // remounts each turn and useState(duration) re-initialises the countdown.

  // Tick
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // Haptic warning at 3s
  useEffect(() => {
    if (left <= 3 && left > 0 && !warnedRef.current) {
      warnedRef.current = true;
      navigator.vibrate?.([100, 50, 100]);
    }
  }, [left]);

  // Expired
  useEffect(() => {
    if (left <= 0 && !endedRef.current) {
      endedRef.current = true;
      onExpired();
    }
  }, [left, onExpired]);

  // Wake lock
  useEffect(() => {
    const nav = navigator as WakeNavigator;
    if (!nav.wakeLock) return;
    let sentinel: WakeSentinel | null = null;
    let cancelled = false;
    const request = () => {
      nav.wakeLock!
        .request('screen')
        .then((s) => {
          if (cancelled) s.release().catch(() => {});
          else sentinel = s;
        })
        .catch(() => {});
    };
    request();
    const onVis = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      sentinel?.release().catch(() => {});
    };
  }, []);

  const done = left <= 0;
  const pct = Math.max(0, Math.min(1, left / duration));
  const urgent = !done && left <= 3;

  return (
    <div className="turn-hotseat">
      {/* Background glow */}
      <div className="turn-hotseat-bg" style={{ background: info.theme.bg }} />

      {/* Avatar */}
      <div className="turn-hotseat-hero">
        <div className="turn-hotseat-blob" style={{ background: info.theme.blob }} />
        <AvatarImg src={info.avatar} alt={info.name} className="turn-hotseat-avatar" />
      </div>

      {/* Name */}
      <h2 className="turn-hotseat-name">{info.name}</h2>

      {/* Circular timer */}
      <div className={`timer-ring-wrap turn-ring${urgent ? ' urgent' : ''}`}>
        <svg className="timer-ring" viewBox="0 0 240 240" aria-hidden="true">
          <circle className="ring-track" cx="120" cy="120" r={RING_R} />
          <circle
            className={`ring-prog${urgent ? ' urgent' : ''}`}
            cx="120"
            cy="120"
            r={RING_R}
            style={{
              strokeDasharray: RING_C,
              strokeDashoffset: RING_C * (1 - pct),
            }}
          />
        </svg>
        <div className="timer-ring-center">
          <p className={`timer-count${done ? ' done' : ''}${urgent ? ' urgent' : ''}`}>
            {done ? t.timeUp : formatTime(left)}
          </p>
          {paused && !done && <p className="timer-paused">{t.pause}</p>}
        </div>
      </div>

      {/* Pause / Resume */}
      {!done && (
        <button
          className="turn-pause-btn"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t.resume : t.pause}
        >
          <FIIcon name={paused ? 'play' : 'pause'} size={22} strokeWidth={2.8} />
        </button>
      )}
    </div>
  );
}

/* ── Clue checklist grid ── */

function TurnChecklist({
  playersInfo,
  turnOrder,
  currentSpeaker,
  spokenPlayers,
}: {
  playersInfo: { name: string; avatar: string }[];
  turnOrder: number[];
  currentSpeaker: number;
  spokenPlayers: number[];
}) {
  const t = useStrings();

  return (
    <div className="turn-checklist">
      {turnOrder.map((playerIdx, orderIdx) => {
        const info = playersInfo[playerIdx];
        const isSpeaking = orderIdx === currentSpeaker;
        const hasSpoken = spokenPlayers.includes(playerIdx);
        const isPending = !isSpeaking && !hasSpoken;

        return (
          <div
            key={playerIdx}
            className={`turn-clue-chip${isSpeaking ? ' speaking' : ''}${hasSpoken ? ' done' : ''}${isPending ? ' pending' : ''}`}
          >
            <AvatarImg src={info.avatar} alt={info.name} className="turn-clue-avatar" />
            <span className="turn-clue-name">{info.name}</span>
            <span className="turn-clue-status">
              {isSpeaking ? t.speaking : hasSpoken ? t.clueGiven : t.pending}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Top-level screen ── */

export function TimerScreen() {
  const settings = useGameStore((s) => s.settings);
  if (settings.timerType === 'turn') return <TurnTimer />;
  return <FreeformTimer />;
}
