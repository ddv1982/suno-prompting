import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import {
  buildGenreTableMarkdown,
  GENRE_TABLE_END,
  GENRE_TABLE_START,
  buildInstrumentClassesMarkdown,
  INSTRUMENT_CLASSES_END,
  INSTRUMENT_CLASSES_START,
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
});
