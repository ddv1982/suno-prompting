import { VOCAL_TECHNIQUES } from '@bun/prompt/vocal-descriptors';
import { parseVocalStyleDescriptorToTags } from '@bun/prompt/vocal-style-tags';

const DEFAULT_MAX_ITEMS = 6;

const TECHNIQUE_SET = new Set<string>(VOCAL_TECHNIQUES.map((t) => t.toLowerCase()));

function splitCsvItems(csv: string): string[] {
  return csv
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function isVocalStyleItem(item: string): boolean {
  const lower = item.toLowerCase();
  if (/\b(vocals?|voice|singer|singing|vocal)\b/i.test(item)) return true;
  if (TECHNIQUE_SET.has(lower)) return true;
  if (/\bdelivery\b/i.test(item)) return true;
  return false;
}

function capItemsPreservingVocalStyleAndLeadingInstruments(items: string[], maxItems: number): string[] {
  if (items.length <= maxItems) return items;

  const vocalItems: string[] = [];
  const otherItems: string[] = [];

  for (const item of items) {
    if (isVocalStyleItem(item)) {
      vocalItems.push(item);
    } else {
      otherItems.push(item);
    }
  }

  if (vocalItems.length >= maxItems) {
    return vocalItems.slice(0, maxItems);
  }

  const allowedOther = maxItems - vocalItems.length;
  return [...otherItems.slice(0, allowedOther), ...vocalItems];
}

export function mergeInstrumentTagsIntoCsv(
  instrumentsCsv: string,
  tags: string[],
  options?: { maxItems?: number; stripVocalStyleItems?: boolean }
): string {
  const maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;
  const stripVocalStyleItems = options?.stripVocalStyleItems ?? true;

  const baseItems = splitCsvItems(instrumentsCsv);
  const cleaned = stripVocalStyleItems ? baseItems.filter((i) => !isVocalStyleItem(i)) : baseItems;

  const merged = dedupeCaseInsensitive([...cleaned, ...tags]);
  const capped = capItemsPreservingVocalStyleAndLeadingInstruments(merged, maxItems);

  return capped.join(', ');
}

export function injectVocalStyleIntoInstrumentsCsv(
  instrumentsCsv: string,
  vocalStyle?: string,
  options?: { maxItems?: number }
): string {
  if (!vocalStyle?.trim()) return instrumentsCsv;
  const tags = parseVocalStyleDescriptorToTags(vocalStyle);
  if (tags.length === 0) return instrumentsCsv;

  return mergeInstrumentTagsIntoCsv(instrumentsCsv, tags, {
    maxItems: options?.maxItems,
    stripVocalStyleItems: true,
  });
}

export function injectInstrumentTags(
  prompt: string,
  tags: string[],
  maxMode: boolean,
  options?: { maxItems?: number }
): string {
  if (tags.length === 0) return prompt;

  const maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;

  // Max format: instruments: "piano, bass"
  const quotedMatch = prompt.match(/^(instruments:\s*")([^"]*)"/mi);
  if (quotedMatch) {
    const existingValue = (quotedMatch[2] ?? '').trim();
    const merged = mergeInstrumentTagsIntoCsv(existingValue, tags, { maxItems, stripVocalStyleItems: true });
    return prompt.replace(/^(instruments:\s*")[^"]*"/mi, `$1${merged}"`);
  }

  // Non-max format: Instruments: piano, bass
  const unquotedMatch = prompt.match(/^(Instruments:[^\S\n]*)([^\n]*)$/m);
  if (unquotedMatch) {
    const existingValue = (unquotedMatch[2] ?? '').trim();
    const merged = mergeInstrumentTagsIntoCsv(existingValue, tags, { maxItems, stripVocalStyleItems: true });
    return prompt.replace(/^(Instruments:[^\S\n]*)([^\n]*)$/m, `$1${merged}`);
  }

  // If there is no instruments line, insert one in a format-aware way.
  const lines = prompt.split('\n');

  if (maxMode) {
    const bpmIdx = lines.findIndex((l) => /^bpm:\s*"/i.test(l));
    const insertAt = bpmIdx >= 0 ? bpmIdx + 1 : 0;
    lines.splice(insertAt, 0, `instruments: "${mergeInstrumentTagsIntoCsv('', tags, { maxItems })}"`);
    return lines.join('\n');
  }

  const moodIdx = lines.findIndex((l) => /^Mood:/i.test(l));
  const insertAt = moodIdx >= 0 ? moodIdx + 1 : 0;
  lines.splice(insertAt, 0, `Instruments: ${mergeInstrumentTagsIntoCsv('', tags, { maxItems })}`);
  return lines.join('\n');
}
