/**
 * Helper functions for recording context selection
 * @module prompt/tags/recording-context/helpers
 */

/**
 * Select random item from a category subcategory
 */
export function selectFromSubcategory<T extends Record<string, readonly string[]>>(
  category: T,
  subcategory: keyof T,
  rng: () => number
): string {
  const items = category[subcategory];
  if (!items || items.length === 0) return '';
  const index = Math.floor(rng() * items.length);
  return items[index] ?? '';
}

/**
 * Select random subcategory key from category
 */
export function selectRandomKey<T extends Record<string, unknown>>(
  obj: T,
  rng: () => number
): keyof T {
  const keys = Object.keys(obj) as Array<keyof T>;
  const index = Math.floor(rng() * keys.length);
  const selected = keys[index];
  if (selected !== undefined) return selected;
  // Fallback to first key (should never happen with non-empty objects)
  return keys[0] as keyof T;
}
