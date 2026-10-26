import { useGameStore } from '../store/gameStore';
import { DECKS } from '../data/words';
import { useStrings } from '../i18n';
import { FIIcon } from './Icons';

export function CategoryScreen() {
  const { setDeckId, setScreen, setSettingsFrom, setShowInfo, setShowStats } = useGameStore();
  const t = useStrings();

  const handlePick = (deck: (typeof DECKS)[0]) => {
    setDeckId(deck.id);
    setSettingsFrom('category');
    setScreen('settings');
  };

  return (
    <div className="screen lobby">
      <header className="hdr">
        <span className="logo">Fake Out</span>
        <button
          className="hdr-btn left"
          aria-label={t.playersAria}
          onClick={() => setScreen('setup')}
        >
          <FIIcon name="users" size={27} strokeWidth={2.4} />
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
            aria-label={t.howToPlayAria}
            onClick={() => setShowInfo(true)}
          >
            <FIIcon name="info" size={27} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="scroll" style={{ paddingBottom: 60 }}>
        {DECKS.map((deck) => (
          <button
            key={deck.id}
            type="button"
            className="deck"
            aria-label={`Play ${deck.title}`}
            onClick={() => handlePick(deck)}
          >
            <h3>{deck.title}</h3>
            <p>{deck.desc}</p>
            <div className="deck-art">
              {deck.art}
              <span className="sub">{deck.art2}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
