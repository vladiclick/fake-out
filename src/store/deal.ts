import { shuffle } from '../data/words';

/**
 * Picks the imposters and the speaking order for one round. The two are
 * shuffled separately so the first speaker says nothing about who the
 * imposter is.
 */
export function dealRoles(playerCount: number, imposterCount: number) {
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  return {
    imposters: shuffle(indices).slice(0, imposterCount),
    turnOrder: shuffle(indices),
  };
}
