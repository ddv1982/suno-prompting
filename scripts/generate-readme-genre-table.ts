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
    `**Foundational instruments** (anchors): ${FOUNDATIONAL_INSTRUMENTS.join(', ')}`,
    '',
    `**Multi-genre instruments** (wildcards): ${MULTIGENRE_INSTRUMENTS.join(
      ', ',
    )}`,
    '',
    `**Orchestral color instruments** (gated): ${ORCHESTRAL_COLOR_INSTRUMENTS.join(', ')}`,
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

async function main() {
  const readmePath = new URL('../README.md', import.meta.url);
  const readme = await readFile(readmePath, 'utf8');

  const table = buildGenreTableMarkdown();
  const classes = buildInstrumentClassesMarkdown();
  const combinations = buildCombinationsMarkdown();

  let updated = replaceGenreTableSection(readme, table);
  updated = replaceInstrumentClassesSection(updated, classes);
  updated = replaceCombinationsSection(updated, combinations);

  if (updated === readme) {
    console.log('README genre table is already up to date.');
    return;
  }

  await writeFile(readmePath, updated, 'utf8');
  console.log('Updated README genre table.');
}

if (import.meta.main) {
  await main();
}
