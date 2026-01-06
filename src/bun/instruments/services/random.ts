export type Rng = () => number;

export function createRng(seed: number): Rng {
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    const swapVal = result[j];
    if (temp !== undefined && swapVal !== undefined) {
      result[i] = swapVal;
      result[j] = temp;
    }
  }
  return result;
}

export function pickRandom<T>(arr: readonly T[], rng: Rng = Math.random): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

export function randomIntInclusive(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function rollChance(chance: number | undefined, rng: Rng = Math.random): boolean {
  if (chance === undefined) return true;
  return rng() <= chance;
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
