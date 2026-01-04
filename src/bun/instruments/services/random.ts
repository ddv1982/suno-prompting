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
