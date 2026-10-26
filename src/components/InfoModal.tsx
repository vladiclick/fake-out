import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';

export function InfoModal() {
  const setShowInfo = useGameStore((s) => s.setShowInfo);
  const t = useStrings();

  return (
    <div className="modal-scrim" onClick={() => setShowInfo(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t.howToTitle}</h2>
        <p>{t.howToP1}</p>
        <p>{t.howToP2}</p>
        <p>{t.howToP3}</p>
        <button className="btn-white" onClick={() => setShowInfo(false)}>
          {t.gotIt}
        </button>
      </div>
    </div>
  );
}
