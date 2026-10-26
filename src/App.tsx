import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { useGameStore, type Screen } from './store/gameStore';
import { SetupScreen } from './components/SetupScreen';
import { CategoryScreen } from './components/CategoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RevealScreen } from './components/RevealScreen';
import { StarterScreen } from './components/StarterScreen';
import { TimerScreen } from './components/TimerScreen';
import { VotingScreen } from './components/VotingScreen';
import { MomentOfTruthScreen } from './components/MomentOfTruthScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { InfoModal } from './components/InfoModal';
import { StatsDashboard } from './components/StatsDashboard';

function App() {
  const screen = useGameStore((s) => s.screen);
  const showInfo = useGameStore((s) => s.showInfo);
  const showStats = useGameStore((s) => s.showStats);
  const themeName = useGameStore((s) => s.themeName);
  const gridVisible = useGameStore((s) => s.gridVisible);
  const bgMode = useGameStore((s) => s.bgMode);
  const reduce = useReducedMotion();

  const views: Record<Screen, React.ReactNode> = {
    setup: <SetupScreen />,
    category: <CategoryScreen />,
    settings: <SettingsScreen />,
    reveal: <RevealScreen />,
    starter: <StarterScreen />,
    timer: <TimerScreen />,
    voting: <VotingScreen />,
    momentOfTruth: <MomentOfTruthScreen />,
    results: <ResultsScreen />,
  };

  // Screen-to-screen motion: a spring-driven enter that settles with weight,
  // and a quick, crisp exit so hand-offs feel snappy instead of the uniform
  // scale-and-fade that reads as generic. Content inside each screen does its
  // own choreography on top of this.
  const variants: Variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        initial: { opacity: 0, y: 22 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 },
        },
        exit: {
          opacity: 0,
          y: -16,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <div
      className={`phone theme-${themeName} bg-${bgMode}${gridVisible ? ' grid-on' : ''}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          className="screen-anim"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {views[screen] ?? <SetupScreen />}
        </motion.div>
      </AnimatePresence>
      {showInfo && <InfoModal />}
      {showStats && <StatsDashboard />}
    </div>
  );
}

export default App;
