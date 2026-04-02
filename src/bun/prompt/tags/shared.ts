import { selectRandomN } from '@shared/utils/random';

type TagPool = Record<string, readonly string[]>;

export function selectTagsFromPool(
  tagPool: TagPool,
  count: number,
  rng: () => number = Math.random
): string[] {
  const allTags = Object.values(tagPool).flat();
  return selectRandomN(allTags, Math.min(count, allTags.length), rng);
}
