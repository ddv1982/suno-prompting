import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreDefinition } from '@bun/instruments/genres/types';
import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  isFoundationalInstrument,
  isMultiGenreInstrument,
} from '@bun/instruments/datasets/instrumentClasses';

function uniqLower(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const k = item.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function listGenreInstruments(genre: GenreDefinition): string[] {
  const orderedPools = genre.poolOrder
    .map(key => genre.pools[key])
    .filter(Boolean);
  return uniqLower(orderedPools.flatMap(p => p.instruments));
}

function listGenreSpecificInstruments(genre: GenreDefinition): string[] {
  return listGenreInstruments(genre).filter(
    i => !isFoundationalInstrument(i) && !isMultiGenreInstrument(i)
  );
}

function main() {
  const genres = Object.values(GENRE_REGISTRY);

  const instrumentToGenres = new Map<string, Set<string>>();
  const genreToInstruments = new Map<string, string[]>();

  for (const genre of genres) {
    const instruments = listGenreInstruments(genre);
    genreToInstruments.set(genre.name, instruments);

    for (const instrument of instruments) {
      const key = instrument.toLowerCase();
      const set = instrumentToGenres.get(key) ?? new Set<string>();
      set.add(genre.name);
      instrumentToGenres.set(key, set);
    }
  }

  const genreCounts = [...genreToInstruments.entries()]
    .map(([genre, instruments]) => ({ genre, count: instruments.length }))
    .sort((a, b) => b.count - a.count);

  const genreSpecificCounts = genres
    .map(g => ({ genre: g.name, count: listGenreSpecificInstruments(g).length }))
    .sort((a, b) => b.count - a.count);

  const overlap = [...instrumentToGenres.entries()]
    .map(([instrument, set]) => ({ instrument, genres: [...set].sort(), count: set.size }))
    .sort((a, b) => b.count - a.count || a.instrument.localeCompare(b.instrument));

  console.log('=== Genre instrument counts ===');
  for (const row of genreCounts) {
    console.log(`${row.genre}: ${row.count}`);
  }

  console.log('\n=== Genre-specific counts (excluding foundational + multigenre) ===');
  for (const row of genreSpecificCounts) {
    console.log(`${row.genre}: ${row.count}`);
  }

  console.log('\n=== Foundational instruments ===');
  console.log(FOUNDATIONAL_INSTRUMENTS.join(', '));

  console.log('\n=== Multi-genre instruments (>= 3 genres) ===');
  console.log(MULTIGENRE_INSTRUMENTS.join(', '));

  console.log('\n=== Instruments used in many genres (top 25) ===');
  for (const row of overlap.slice(0, 25)) {
    console.log(`${row.instrument} (${row.count}): ${row.genres.join(', ')}`);
  }

  console.log('\n=== Ambient-only instruments ===');
  const ambientOnly = overlap
    .filter(r => r.count === 1 && r.genres[0] === 'Ambient')
    .map(r => r.instrument)
    .sort();
  console.log(ambientOnly.join(', '));
}

main();
