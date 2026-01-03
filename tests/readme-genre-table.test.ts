import { describe, expect, test } from 'bun:test';
import { readFile, writeFile } from 'node:fs/promises';
import { $ } from 'bun';
import {
  buildGenreTableMarkdown,
  GENRE_TABLE_END,
  GENRE_TABLE_START,
  buildInstrumentClassesMarkdown,
  INSTRUMENT_CLASSES_END,
  INSTRUMENT_CLASSES_START,
  buildCombinationsMarkdown,
  COMBINATIONS_START,
  COMBINATIONS_END,
  replaceCountMarker,
  validateAllMarkers,
  COUNT_MARKERS,
} from '../scripts/generate-readme-genre-table';

function extractBetween(readme: string, startMarker: string, endMarker: string): string {
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Missing markers: ${startMarker} ... ${endMarker}`);
  }

  return readme
    .slice(start + startMarker.length, end)
    .trim();
}

describe('README genre table', () => {
  test('stays in sync with GENRE_REGISTRY', async () => {
    const readmePath = new URL('../README.md', import.meta.url);
    const readme = await readFile(readmePath, 'utf8');

    const actual = extractBetween(readme, GENRE_TABLE_START, GENRE_TABLE_END);
    const expected = buildGenreTableMarkdown();

    expect(actual).toBe(expected);
  });

  test('includes instrument classes section (foundational + multigenre)', async () => {
    const readmePath = new URL('../README.md', import.meta.url);
    const readme = await readFile(readmePath, 'utf8');

    const actual = extractBetween(readme, INSTRUMENT_CLASSES_START, INSTRUMENT_CLASSES_END);
    const expected = buildInstrumentClassesMarkdown();

    expect(actual).toBe(expected);
  });

  test('includes genre combinations section', async () => {
    const readmePath = new URL('../README.md', import.meta.url);
    const readme = await readFile(readmePath, 'utf8');

    const actual = extractBetween(readme, COMBINATIONS_START, COMBINATIONS_END);
    const expected = buildCombinationsMarkdown();

    expect(actual).toBe(expected);
  });
});

describe('replaceCountMarker', () => {
  test('replaces value correctly between markers', () => {
    const input = 'There are <!-- TEST_COUNT -->42<!-- /TEST_COUNT --> items.';
    const result = replaceCountMarker(input, 'TEST_COUNT', 100);
    expect(result).toBe('There are <!-- TEST_COUNT -->100<!-- /TEST_COUNT --> items.');
  });

  test('throws on missing start marker', () => {
    const input = 'There are no markers here.';
    expect(() => replaceCountMarker(input, 'TEST_COUNT', 100)).toThrow(
      'Marker TEST_COUNT not found in README'
    );
  });

  test('throws on missing end marker', () => {
    const input = 'There is only <!-- TEST_COUNT -->42 here.';
    expect(() => replaceCountMarker(input, 'TEST_COUNT', 100)).toThrow(
      'Marker TEST_COUNT not found in README'
    );
  });

  test('returns unchanged string when value already matches', () => {
    const input = 'There are <!-- TEST_COUNT -->42<!-- /TEST_COUNT --> items.';
    const result = replaceCountMarker(input, 'TEST_COUNT', 42);
    expect(result).toBe(input);
  });

  test('handles multiple occurrences of same marker', () => {
    const input = 'First: <!-- TEST_COUNT -->10<!-- /TEST_COUNT -->, Second: <!-- TEST_COUNT -->10<!-- /TEST_COUNT -->';
    const result = replaceCountMarker(input, 'TEST_COUNT', 99);
    expect(result).toBe('First: <!-- TEST_COUNT -->99<!-- /TEST_COUNT -->, Second: <!-- TEST_COUNT -->99<!-- /TEST_COUNT -->');
  });
});

describe('validateAllMarkers', () => {
  const createValidReadme = () => {
    const markers = [
      '<!-- GENRE_TABLE_START -->',
      '<!-- GENRE_TABLE_END -->',
      '<!-- INSTRUMENT_CLASSES_START -->',
      '<!-- INSTRUMENT_CLASSES_END -->',
      '<!-- COMBINATIONS_START -->',
      '<!-- COMBINATIONS_END -->',
      '<!-- SINGLE_GENRE_COUNT -->35<!-- /SINGLE_GENRE_COUNT -->',
      '<!-- MULTI_GENRE_COUNT -->110<!-- /MULTI_GENRE_COUNT -->',
      '<!-- FOUNDATIONAL_COUNT -->14<!-- /FOUNDATIONAL_COUNT -->',
      '<!-- MULTIGENRE_TIER_COUNT -->49<!-- /MULTIGENRE_TIER_COUNT -->',
      '<!-- ORCHESTRAL_COUNT -->41<!-- /ORCHESTRAL_COUNT -->',
    ];
    return markers.join('\n');
  };

  test('passes when all markers present', () => {
    const readme = createValidReadme();
    expect(() => validateAllMarkers(readme)).not.toThrow();
  });

  test('throws descriptive error for missing count marker', () => {
    const readme = createValidReadme().replace('<!-- SINGLE_GENRE_COUNT -->', '');
    expect(() => validateAllMarkers(readme)).toThrow('Missing required marker: <!-- SINGLE_GENRE_COUNT -->');
  });

  test('throws descriptive error for missing table marker', () => {
    const readme = createValidReadme().replace('<!-- GENRE_TABLE_START -->', '');
    expect(() => validateAllMarkers(readme)).toThrow('Missing required marker: <!-- GENRE_TABLE_START -->');
  });

  test('throws descriptive error for missing closing tag', () => {
    const readme = createValidReadme().replace('<!-- /MULTI_GENRE_COUNT -->', '');
    expect(() => validateAllMarkers(readme)).toThrow('Missing closing tag for marker: <!-- /MULTI_GENRE_COUNT -->');
  });
});

describe('--check mode integration', () => {
  const scriptPath = new URL('../scripts/generate-readme-genre-table.ts', import.meta.url).pathname;
  const readmePath = new URL('../README.md', import.meta.url).pathname;

  test('returns exit 0 when README is in sync', async () => {
    // First ensure README is in sync by running the sync command
    await $`bun run ${scriptPath}`.quiet();
    
    // Now check should pass
    const result = await $`bun run ${scriptPath} --check`.quiet().nothrow();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain('README is up to date');
  });

  test('returns exit 1 when README is stale', async () => {
    // First sync to get a known good state
    await $`bun run ${scriptPath}`.quiet();
    
    // Read current README and modify a count
    const readme = await readFile(readmePath, 'utf8');
    const modifiedReadme = readme.replace(
      /<!-- SINGLE_GENRE_COUNT -->\d+<!-- \/SINGLE_GENRE_COUNT -->/,
      '<!-- SINGLE_GENRE_COUNT -->999<!-- /SINGLE_GENRE_COUNT -->'
    );
    await writeFile(readmePath, modifiedReadme, 'utf8');
    
    try {
      // Check should now fail
      const result = await $`bun run ${scriptPath} --check`.quiet().nothrow();
      expect(result.exitCode).toBe(1);
      expect(result.stderr.toString()).toContain('README is out of sync');
    } finally {
      // Restore original README
      await writeFile(readmePath, readme, 'utf8');
    }
  });
});
