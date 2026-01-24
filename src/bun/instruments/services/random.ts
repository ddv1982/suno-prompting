/**
 * Random utilities for instrument selection.
 *
 * Re-exports common utilities from @shared/utils/random and provides
 * domain-specific helpers for genre-based selection.
 *
 * @module bun/instruments/services/random
 */
import { traceDecision } from '@bun/trace';
import { pickRandom } from '@shared/utils/random';

import type { TraceCollector } from '@bun/trace';
import type { Rng } from '@shared/utils/random';

// Re-export common utilities from shared module
export {
  type Rng,
  shuffle,
  pickRandom,
  selectRandom,
  selectRandomN,
  createSeededRng,
  randomIntInclusive,
  rollChance,
} from '@shared/utils/random';

/**
 * Pick a random item and emit a decision event when a trace collector is provided.
 *
 * This is intentionally opt-in (existing `pickRandom` stays unchanged) to avoid
 * overhead and signature churn across the codebase.
 */
export function pickRandomTraced<T>(
  arr: readonly T[],
  options: {
    readonly rng?: Rng;
    readonly trace?: TraceCollector;
    readonly domain: Parameters<typeof traceDecision>[1]['domain'];
    readonly key: string;
    readonly branchTaken: string;
    readonly why: string;
    /** Optional preview strings for candidates (will be capped+truncated in trace). */
    readonly candidatesPreview?: readonly string[];
  }
): T | undefined {
  const rng = options.rng ?? Math.random;
  if (arr.length === 0) {
    traceDecision(options.trace, {
      domain: options.domain,
      key: options.key,
      branchTaken: options.branchTaken,
      why: `${options.why}; candidates=0`,
      selection: {
        method: 'pickRandom',
        candidates: options.candidatesPreview ?? [],
      },
    });
    return undefined;
  }

  const chosenIndex = Math.floor(rng() * arr.length);
  traceDecision(options.trace, {
    domain: options.domain,
    key: options.key,
    branchTaken: options.branchTaken,
    why: `${options.why}; candidates=${arr.length}`,
    selection: {
      method: 'pickRandom',
      chosenIndex,
      candidates: options.candidatesPreview,
    },
  });
  return arr[chosenIndex];
}

/**
 * Collect unique items from a mapping based on genre components, then pick one randomly.
 * Generic helper to reduce duplication in genre blending functions.
 *
 * @param components - Array of genre components to look up
 * @param mapping - Record mapping genre names to arrays of items
 * @param defaultItems - Fallback items when genre not found (null = skip unknown genres)
 * @param rng - Random number generator
 * @returns Randomly selected item from combined pool, or undefined if empty
 */
export function collectAndPickFromGenres<T>(
  components: readonly string[],
  mapping: Readonly<Record<string, readonly T[]>>,
  defaultItems: readonly T[] | null,
  rng: Rng = Math.random
): T | undefined {
  const allItems = new Set<T>();

  for (const genre of components) {
    const items = mapping[genre] ?? defaultItems;
    if (items) {
      for (const item of items) {
        allItems.add(item);
      }
    }
  }

  return pickRandom([...allItems], rng);
}

/**
 * Collect all unique items from a mapping based on genre components.
 * Generic helper to reduce duplication in genre blending functions.
 *
 * @param components - Array of genre components to look up
 * @param mapping - Record mapping genre names to arrays of items
 * @param defaultItems - Fallback items when genre not found (null = skip unknown genres)
 * @returns Array of unique items from all genre components
 */
export function collectAllFromGenres<T>(
  components: readonly string[],
  mapping: Readonly<Record<string, readonly T[]>>,
  defaultItems: readonly T[] | null
): T[] {
  const allItems = new Set<T>();

  for (const genre of components) {
    const items = mapping[genre] ?? defaultItems;
    if (items) {
      for (const item of items) {
        allItems.add(item);
      }
    }
  }

  return [...allItems];
}
