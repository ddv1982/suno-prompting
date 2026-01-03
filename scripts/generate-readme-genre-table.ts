import { readFile, writeFile } from 'node:fs/promises';
import { GENRE_REGISTRY, MULTI_GENRE_COMBINATIONS } from '@bun/instruments/genres';
import type { GenreDefinition, InstrumentPool } from '@bun/instruments/genres/types';
import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  ORCHESTRAL_COLOR_INSTRUMENTS,
} from '@bun/instruments/datasets/instrument-classes';

export const GENRE_TABLE_START = '<!-- GENRE_TABLE_START -->';
export const GENRE_TABLE_END = '<!-- GENRE_TABLE_END -->';

export const INSTRUMENT_CLASSES_START = '<!-- INSTRUMENT_CLASSES_START -->';
export const INSTRUMENT_CLASSES_END = '<!-- INSTRUMENT_CLASSES_END -->';

export const COMBINATIONS_START = '<!-- COMBINATIONS_START -->';
export const COMBINATIONS_END = '<!-- COMBINATIONS_END -->';

// Dynamic count markers for inline README synchronization
export const COUNT_MARKERS = {
  SINGLE_GENRE_COUNT: 'SINGLE_GENRE_COUNT',
  MULTI_GENRE_COUNT: 'MULTI_GENRE_COUNT',
  FOUNDATIONAL_COUNT: 'FOUNDATIONAL_COUNT',
  MULTIGENRE_TIER_COUNT: 'MULTIGENRE_TIER_COUNT',
  ORCHESTRAL_COUNT: 'ORCHESTRAL_COUNT',
} as const;

type Options = {
  readonly includeOptionalPools: boolean;
};

const DEFAULT_OPTIONS: Options = {
  includeOptionalPools: true,
};

function uniqueInOrder(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Escapes special regex characters for safe use in RegExp patterns.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces the numeric value between paired HTML comment markers.
 * Pattern: `<!-- MARKER -->N<!-- /MARKER -->` where N is replaced with value.
 * @throws Error if marker not found in README
 */
export function replaceCountMarker(readme: string, marker: string, value: number): string {
  const startTag = `<!-- ${marker} -->`;
  const endTag = `<!-- /${marker} -->`;
  const pattern = new RegExp(
    `${escapeRegExp(startTag)}\\d+${escapeRegExp(endTag)}`,
    'g',
  );

  const replacement = `${startTag}${value}${endTag}`;
  const result = readme.replace(pattern, replacement);

  // Validate marker was found
  if (result === readme && !readme.includes(replacement)) {
    throw new Error(`Marker ${marker} not found in README. Expected pattern: ${startTag}N${endTag}`);
  }

  return result;
}

/**
 * Validates that all required markers exist in the README.
 * @throws Error if any marker is missing
 */
export function validateAllMarkers(readme: string): void {
  const tableMarkers = [
    'GENRE_TABLE_START',
    'GENRE_TABLE_END',
    'INSTRUMENT_CLASSES_START',
    'INSTRUMENT_CLASSES_END',
    'COMBINATIONS_START',
    'COMBINATIONS_END',
  ];

  const countMarkers = Object.values(COUNT_MARKERS);

  const allMarkers = [...tableMarkers, ...countMarkers];

  for (const marker of allMarkers) {
    if (!readme.includes(`<!-- ${marker} -->`)) {
      throw new Error(`Missing required marker: <!-- ${marker} -->`);
    }
  }

  // Also validate closing tags for count markers
  for (const marker of countMarkers) {
    if (!readme.includes(`<!-- /${marker} -->`)) {
      throw new Error(`Missing closing tag for marker: <!-- /${marker} -->`);
    }
  }
}

function isRequiredPool(pool: InstrumentPool): boolean {
  return pool.pick.min > 0;
}

function poolWeight(pool: InstrumentPool): number {
  // Prefer optional pools that are more likely to appear.
  if (pool.chanceToInclude === undefined) return 0.15;
  return pool.chanceToInclude;
}

function listGenreInstruments(genre: GenreDefinition, options: Options): string[] {
  const { includeOptionalPools } = options;

  const requiredPools = genre.poolOrder
    .map(k => genre.pools[k])
    .filter((p): p is InstrumentPool => Boolean(p))
    .filter(isRequiredPool);

  const requiredInstruments = uniqueInOrder(requiredPools.flatMap(p => p.instruments));
  const picked: string[] = [...requiredInstruments];

  if (includeOptionalPools) {
    const optionalPools = genre.poolOrder
      .map(k => genre.pools[k])
      .filter((p): p is InstrumentPool => Boolean(p))
      .filter(p => !isRequiredPool(p))
      .sort((a, b) => poolWeight(b) - poolWeight(a));

    for (const pool of optionalPools) {
      for (const instrument of pool.instruments) {
        picked.push(instrument);
      }
    }
  }

  return uniqueInOrder(picked);
}

export function buildGenreTableMarkdown(options: Partial<Options> = {}): string {
  const resolved: Options = { ...DEFAULT_OPTIONS, ...options };

  const lines: string[] = [];
  lines.push('| Genre | Keywords | Key Instruments |');
  lines.push('|-------|----------|-----------------|');

  for (const genre of Object.values(GENRE_REGISTRY)) {
    const keywords = genre.keywords.join(', ');
    const instruments = listGenreInstruments(genre, resolved).join(', ');
    lines.push(`| ${genre.name} | ${keywords} | ${instruments} |`);
  }

  return lines.join('\n');
}

export function replaceGenreTableSection(readme: string, tableMarkdown: string): string {
  const start = readme.indexOf(GENRE_TABLE_START);
  const end = readme.indexOf(GENRE_TABLE_END);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `README is missing genre table markers. Expected ${GENRE_TABLE_START} ... ${GENRE_TABLE_END}`,
    );
  }

  const before = readme.slice(0, start + GENRE_TABLE_START.length);
  const after = readme.slice(end);

  return `${before}\n\n${tableMarkdown}\n\n${after}`;
}

export function buildInstrumentClassesMarkdown(): string {
  return [
    '| Tier | Count | Instruments |',
    '|------|-------|-------------|',
    `| **Foundational** | ${FOUNDATIONAL_INSTRUMENTS.length} | ${FOUNDATIONAL_INSTRUMENTS.join(', ')} |`,
    `| **Multi-genre** | ${MULTIGENRE_INSTRUMENTS.length} | ${MULTIGENRE_INSTRUMENTS.join(', ')} |`,
    `| **Orchestral** | ${ORCHESTRAL_COLOR_INSTRUMENTS.length} | ${ORCHESTRAL_COLOR_INSTRUMENTS.join(', ')} |`,
  ].join('\n');
}

export function replaceInstrumentClassesSection(readme: string, markdown: string): string {
  const start = readme.indexOf(INSTRUMENT_CLASSES_START);
  const end = readme.indexOf(INSTRUMENT_CLASSES_END);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `README is missing instrument classes markers. Expected ${INSTRUMENT_CLASSES_START} ... ${INSTRUMENT_CLASSES_END}`,
    );
  }

  const before = readme.slice(0, start + INSTRUMENT_CLASSES_START.length);
  const after = readme.slice(end);

  return `${before}\n\n${markdown}\n\n${after}`;
}

export function buildCombinationsMarkdown(): string {
  return MULTI_GENRE_COMBINATIONS.join(', ');
}

export function replaceCombinationsSection(readme: string, markdown: string): string {
  const start = readme.indexOf(COMBINATIONS_START);
  const end = readme.indexOf(COMBINATIONS_END);

  if (start === -1 || end === -1 || end < start) {
    // Combinations section is optional - skip if not present
    return readme;
  }

  const before = readme.slice(0, start + COMBINATIONS_START.length);
  const after = readme.slice(end);

  return `${before}\n\n${markdown}\n\n${after}`;
}

// Parse CLI arguments
const args = process.argv.slice(2);
const checkMode = args.includes('--check');

async function main() {
  const readmePath = new URL('../README.md', import.meta.url);
  const readme = await readFile(readmePath, 'utf8');

  // Validate all markers are present early (fail-fast)
  validateAllMarkers(readme);

  // Build dynamic content for table sections
  const table = buildGenreTableMarkdown();
  const classes = buildInstrumentClassesMarkdown();
  const combinations = buildCombinationsMarkdown();

  // Apply table section replacements
  let updated = replaceGenreTableSection(readme, table);
  updated = replaceInstrumentClassesSection(updated, classes);
  updated = replaceCombinationsSection(updated, combinations);

  // Compute dynamic counts from source data
  const singleGenreCount = Object.keys(GENRE_REGISTRY).length;
  const multiGenreCount = MULTI_GENRE_COMBINATIONS.length;
  const foundationalCount = FOUNDATIONAL_INSTRUMENTS.length;
  const multigenreTierCount = MULTIGENRE_INSTRUMENTS.length;
  const orchestralCount = ORCHESTRAL_COLOR_INSTRUMENTS.length;

  // Apply count marker replacements
  updated = replaceCountMarker(updated, COUNT_MARKERS.SINGLE_GENRE_COUNT, singleGenreCount);
  updated = replaceCountMarker(updated, COUNT_MARKERS.MULTI_GENRE_COUNT, multiGenreCount);
  updated = replaceCountMarker(updated, COUNT_MARKERS.FOUNDATIONAL_COUNT, foundationalCount);
  updated = replaceCountMarker(updated, COUNT_MARKERS.MULTIGENRE_TIER_COUNT, multigenreTierCount);
  updated = replaceCountMarker(updated, COUNT_MARKERS.ORCHESTRAL_COUNT, orchestralCount);

  // Check mode: validate README is in sync without writing
  if (checkMode) {
    if (updated !== readme) {
      console.error('README is out of sync. Run `bun run readme:sync` to update.');
      process.exit(1);
    }
    console.log('README is up to date.');
    return;
  }

  // Normal mode: write changes if any
  if (updated === readme) {
    console.log('README is already up to date.');
    return;
  }

  await writeFile(readmePath, updated, 'utf8');
  console.log('Updated README.');
}

if (import.meta.main) {
  await main();
}
