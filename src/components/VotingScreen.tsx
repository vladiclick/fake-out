import { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';
import { AvatarImg } from './AvatarImg';

export function VotingScreen() {
  const { game, setScreen, castVote } = useGameStore();
  const t = useStrings();
  const [selected, setSelected] = useState<number | null>(null);
  const submittedRef = useRef(false);

  if (!game) return null;
  const playersInfo = game.playersInfo;

  return (
    <div className="screen voting-screen">
      <header className="hdr" style={{ minHeight: 54, padding: '20px 20px 0' }}>
        <button
          className="hdr-btn left"
          aria-label={t.back}
          onClick={() => setScreen('timer')}
        >
          <FIIcon name="chevronLeft" size={30} strokeWidth={3} />
        </button>
      </header>

      <div className="vote-head">
        <h1>{t.whoImposter}</h1>
        <p>{t.discussVote}</p>
      </div>

      <div className="scroll vote-scroll">
        <div className="vote-grid">
          {playersInfo.map((info, i) => {
            const isSel = selected === i;
            return (
              <button
                key={i}
                type="button"
                className={`vote-card${isSel ? ' selected' : ''}`}
                style={{ background: info.theme.bg }}
                aria-pressed={isSel}
                aria-label={t.voteFor(info.name)}
                onClick={() => setSelected((cur) => (cur === i ? null : i))}
              >
                <span className="vote-blob" style={{ background: info.theme.blob }} />
                <AvatarImg src={info.avatar} alt={info.name} className="vote-avatar-img" />
                <span className="vote-name">{info.name}</span>
                {isSel && (
                  <span className="vote-check" aria-hidden="true">
                    <FIIcon name="check" size={22} strokeWidth={3.4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        className={`cta-bar${selected === null ? ' disabled' : ''}`}
        disabled={selected === null}
        onClick={() => {
          if (selected === null || submittedRef.current) return;
          submittedRef.current = true;
          castVote(selected);
        }}
      >
        <span className="cta-main">{t.lockItIn}</span>
        {selected !== null && (
          <>
            <span className="cta-div" />
            <span className="cta-sub">{playersInfo[selected].name}</span>
          </>
        )}
      </button>
    </div>
  );
}
