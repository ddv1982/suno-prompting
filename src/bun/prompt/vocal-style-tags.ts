import {
  DEFAULT_VOCAL_STYLE,
  GENRE_VOCAL_STYLES,
  VOCAL_DELIVERIES,
  VOCAL_RANGES,
  VOCAL_TECHNIQUES,
} from '@bun/prompt/vocal-descriptors';

const RANGE_SET = new Set<string>([
  ...VOCAL_RANGES.male,
  ...VOCAL_RANGES.female,
  ...VOCAL_RANGES.neutral,
].map((r) => r.toLowerCase()));

const TECHNIQUE_SET = new Set<string>(VOCAL_TECHNIQUES.map((t) => t.toLowerCase()));

const DELIVERY_SET = new Set<string>([
  ...VOCAL_DELIVERIES,
  ...Object.values(GENRE_VOCAL_STYLES).flatMap((s) => s.deliveries),
  ...DEFAULT_VOCAL_STYLE.deliveries,
].map((d) => d.toLowerCase()));

function normalizeSpaces(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

function stripPrefix(input: string, prefix: string): string {
  const lower = input.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  if (!lower.startsWith(lowerPrefix)) return input;
  return input.slice(prefix.length).trim();
}

function parseRangeTag(rangePart: string): string | null {
  const normalized = normalizeSpaces(rangePart).toLowerCase();
  if (!normalized) return null;

  if (!RANGE_SET.has(normalized)) return null;
  return `${normalized} vocals`;
}

function parseDeliveryTag(deliveryPart: string): string | null {
  const normalized = normalizeSpaces(deliveryPart)
    .replace(/\s+delivery\s*$/i, '')
    .trim()
    .toLowerCase();

  if (!normalized) return null;
  if (!DELIVERY_SET.has(normalized)) return null;
  return `${normalized} vocals`;
}

function parseTechniqueTag(techniquePart: string): string | null {
  const normalized = normalizeSpaces(techniquePart).toLowerCase();
  if (!normalized) return null;

  if (TECHNIQUE_SET.has(normalized)) {
    return normalized;
  }

  // If it doesn’t match a known technique, skip it to avoid injecting noisy tags.
  return null;
}

export function parseVocalStyleDescriptorToTags(vocalStyle: string): string[] {
  const raw = stripPrefix(vocalStyle.trim(), 'Vocal style:');
  if (!raw) return [];

  const parts = raw
    .split(',')
    .map((p) => normalizeSpaces(p))
    .filter(Boolean);

  const [rangePart, deliveryPart, techniquePart] = parts;

  const tags: (string | null)[] = [
    rangePart ? parseRangeTag(rangePart) : null,
    deliveryPart ? parseDeliveryTag(deliveryPart) : null,
    techniquePart ? parseTechniqueTag(techniquePart) : null,
  ];

  const seen = new Set<string>();
  return tags
    .filter((t): t is string => Boolean(t))
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, 3);
}
