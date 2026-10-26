import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useStrings } from '../i18n';
import { AvatarImg } from './AvatarImg';

export function StarterScreen() {
  const { game, setScreen } = useGameStore();
  const t = useStrings();
  const reduce = useReducedMotion();

  if (!game) return null;

  // The starter is stored by name; resolve back to their avatar + theme so the
  // hand-off screen shows the same character the player just saw on reveal.
  const info =
    game.playersInfo.find((p) => p.name === game.starter) ?? game.playersInfo[0];

  // Choreographed entrance: the screen container (App-level) handles the
  // screen-to-screen motion; here the content cascades in so it reads as a
  // deliberate reveal rather than one block fading at once.
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.11, delayChildren: reduce ? 0 : 0.06 },
    },
  };
  const rise: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 26 } },
      };
  const pop: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.55 },
        show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 15 } },
      };

  return (
    <div className="screen starter-screen">
      <motion.div
        className="starter-body"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p className="starter-eyebrow" variants={rise}>
          {t.starterEyebrow}
        </motion.p>

        <motion.div className="starter-hero" variants={pop}>
          <div className="starter-glow" style={{ background: info.theme.blob }} />
          <AvatarImg src={info.avatar} alt={info.name} className="starter-avatar-img" />
        </motion.div>

        <motion.h1 className="starter-name" variants={rise}>
          {info.name}
        </motion.h1>
        <motion.p className="starter-role" variants={rise}>
          {t.starterStarts}
        </motion.p>
        <motion.p className="starter-instruction" variants={rise}>
          {t.starterInstruction}
        </motion.p>
      </motion.div>

      <motion.div
        className="starter-foot"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0.2 }
            : { delay: 0.5, type: 'spring', stiffness: 340, damping: 26 }
        }
      >
        <button className="btn-white wide" onClick={() => setScreen('timer')}>
          {t.starterBtn}
        </button>
      </motion.div>
    </div>
  );
}
