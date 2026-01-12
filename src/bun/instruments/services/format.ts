/**
 * Instrument Formatting Service
 *
 * Provides functions for formatting instrument selections into prompt-ready strings.
 * Contains format functions and formatting utilities for various musical elements.
 *
 * @module instruments/services/format
 *
 * @standards-exception
 * This file intentionally exceeds the 300-line guideline.
 * Reason: Contains tightly coupled formatting functions that work together.
 * Splitting would create circular dependencies and reduce cohesion.
 * Approved: 2026-01-12
 */

import { RHYTHMIC_STYLES } from '@bun/instruments/datasets/rhythm';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  getBlendedHarmonicStyle,
  getBlendedTimeSignature,
  getBlendedPolyrhythm,
} from '@bun/instruments/genres/mappings';
import { HARMONIC_STYLES, ALL_COMBINATIONS, selectInstrumentsForMode } from '@bun/instruments/modes';
import { ALL_POLYRHYTHM_COMBINATIONS, POLYRHYTHMS, TIME_SIGNATURES, TIME_SIGNATURE_JOURNEYS } from '@bun/instruments/rhythms';
import { shuffle, pickRandom } from '@bun/instruments/services/random';
import { selectInstrumentsForGenre, type InstrumentSelectionOptions } from '@bun/instruments/services/select';
import { articulateInstrument } from '@bun/prompt/articulations';
import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { buildProgressionDescriptor } from '@bun/prompt/chord-progressions';
import { buildProductionDescriptorMulti } from '@bun/prompt/production-elements';
import { buildVocalDescriptor } from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';

import type { RhythmicStyle } from '@bun/instruments/datasets/rhythm';
import type { GenreType } from '@bun/instruments/genres';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import type { PolyrhythmCombinationType, TimeSignatureType, TimeSignatureJourneyType } from '@bun/instruments/rhythms';
import type { Rng } from '@bun/instruments/services/random';

export function getHarmonicGuidance(style: HarmonicStyle, rng: Rng = Math.random): string {
  const s = HARMONIC_STYLES[style];
  const chars = shuffle(s.characteristics, rng).slice(0, 3);
  const prog = pickRandom(s.progressions, rng);

  const lines = [
    `HARMONIC STYLE (${s.name}):`,
    s.description,
    `Chord: ${s.chordType}`,
    `Formula: ${s.formula}`,
    ...chars.map(c => `- ${c}`),
    `Suggested Progression: ${String(prog)}`,
    `Examples: ${s.keyExamples}`,
  ];

  const instruments = selectInstrumentsForMode(style);
  if (instruments.length > 0) {
    lines.push(`Suggested instruments: ${instruments.join(', ')}`);
  }

  return lines.join('\n');
}

export function getRhythmicGuidance(style: RhythmicStyle, rng: Rng = Math.random): string {
  const s = RHYTHMIC_STYLES[style];
  const chars = shuffle(s.characteristics, rng).slice(0, 3);

  return [
    `RHYTHMIC STYLE (${s.name}):`,
    s.description,
    `Common ratios: ${s.commonRatios}`,
    `Suggested elements: ${s.instruments}`,
    ...chars.map(c => `- ${c}`),
  ].join('\n');
}

export function getCombinationGuidance(combo: CombinationType, rng: Rng = Math.random): string {
  const c = ALL_COMBINATIONS[combo];
  const progs = shuffle([...c.progressions], rng).slice(0, 3);

  const lines = [
    `MODAL COMBINATION: ${c.name}`,
    c.description,
    '',
  ];

  if ('sectionGuide' in c && c.sectionGuide) {
    lines.push('SECTION GUIDE:');
    const guide = c.sectionGuide;
    if ('chorus' in guide && 'bridgeOutro' in guide) {
      lines.push(`- INTRO/VERSE: ${guide.introVerse}`);
      lines.push(`- CHORUS: ${guide.chorus}`);
      lines.push(`- BRIDGE/OUTRO: ${guide.bridgeOutro}`);
    } else if ('chorusBridgeOutro' in guide) {
      lines.push(`- INTRO/VERSE: ${guide.introVerse}`);
      lines.push(`- CHORUS/BRIDGE/OUTRO: ${guide.chorusBridgeOutro}`);
    }
    lines.push('');
  }

  lines.push(`Emotional Arc: ${c.emotionalArc}`);
  lines.push('');

  if ('borrowedChords' in c) {
    lines.push(`Borrowed chords: ${c.borrowedChords.join(', ')}`);
    lines.push('');
  }

  lines.push('Suggested progressions:');
  lines.push(...progs.map(p => `- ${p}`));

  if ('famousExamples' in c && c.famousExamples) {
    lines.push('');
    lines.push(`Famous examples: ${c.famousExamples.join(', ')}`);
  }

  lines.push('');
  lines.push(`Best instruments: ${c.bestInstruments.join(', ')}`);

  return lines.join('\n');
}

export function getPolyrhythmCombinationGuidance(combo: PolyrhythmCombinationType): string {
  const c = ALL_POLYRHYTHM_COMBINATIONS[combo];

  const lines = [
    `POLYRHYTHM COMBINATION: ${c.name}`,
    c.description,
    '',
    'SECTION GUIDE:',
  ];

  const guide = c.sectionGuide;
  if ('chorus' in guide && 'bridgeOutro' in guide) {
    lines.push(`- INTRO/VERSE: ${guide.introVerse}`);
    lines.push(`- CHORUS: ${guide.chorus}`);
    lines.push(`- BRIDGE/OUTRO: ${guide.bridgeOutro}`);
  } else if ('chorusBridgeOutro' in guide) {
    lines.push(`- INTRO/VERSE: ${guide.introVerse}`);
    lines.push(`- CHORUS/BRIDGE/OUTRO: ${guide.chorusBridgeOutro}`);
  }

  lines.push('');
  lines.push(`Emotional Arc: ${c.emotionalArc}`);
  lines.push('');
  lines.push(`Best instruments: ${c.bestInstruments.join(', ')}`);

  return lines.join('\n');
}

export function getTimeSignatureGuidance(sig: TimeSignatureType, rng: Rng = Math.random): string {
  const s = TIME_SIGNATURES[sig];
  const chars = shuffle([...s.characteristics], rng).slice(0, 3);
  const grouping = pickRandom(s.groupings, rng);

  const lines = [
    `TIME SIGNATURE: ${s.name} (${s.signature})`,
    s.description,
    '',
    `Feel: ${s.feel}`,
    `Beats: ${s.beats} per measure (${s.subdivision} note pulse)`,
    `Grouping: ${String(grouping)}`,
    '',
    'Characteristics:',
    ...chars.map(c => `- ${c}`),
  ];

  if (s.famousExamples.length > 0) {
    lines.push('');
    lines.push(`Famous examples: ${s.famousExamples.join(', ')}`);
  }

  lines.push('');
  lines.push(`Best genres: ${s.bestGenres.join(', ')}`);

  return lines.join('\n');
}

export function getTimeSignatureJourneyGuidance(journey: TimeSignatureJourneyType): string {
  const j = TIME_SIGNATURE_JOURNEYS[journey];

  const lines = [
    `TIME SIGNATURE JOURNEY: ${j.name}`,
    j.description,
    '',
    'SECTION GUIDE:',
  ];

  const guide = j.sectionGuide as {
    introVerse: string;
    chorus?: string;
    bridgeOutro?: string;
    chorusBridgeOutro?: string;
  };
  lines.push(`- INTRO/VERSE: ${guide.introVerse}`);
  if (guide.chorus) {
    lines.push(`- CHORUS: ${guide.chorus}`);
  }
  if (guide.bridgeOutro) {
    lines.push(`- BRIDGE/OUTRO: ${guide.bridgeOutro}`);
  } else if (guide.chorusBridgeOutro) {
    lines.push(`- CHORUS/BRIDGE/OUTRO: ${guide.chorusBridgeOutro}`);
  }

  lines.push('');
  lines.push(`Emotional Arc: ${j.emotionalArc}`);
  lines.push('');
  lines.push(`Best genres: ${j.bestGenres.join(', ')}`);

  return lines.join('\n');
}

export function getGenreInstruments(
  genre: GenreType,
  options?: InstrumentSelectionOptions
): string {
  const def = GENRE_REGISTRY[genre];
  const rng = options?.rng ?? Math.random;
  const maxTags = options?.maxTags ?? def.maxTags;
  const userInstruments = options?.userInstruments ?? [];

  const userSelected = userInstruments.slice(0, maxTags);
  const selected = selectInstrumentsForGenre(genre, options);

  const lines: string[] = [
    'SUGGESTED INSTRUMENTS (Suno tags):',
    `${def.name}: ${def.description}`,
    '',
  ];

  // Add BPM guidance if available
  if (def.bpm) {
    lines.push(`Tempo: ${def.bpm.typical} BPM (range: ${def.bpm.min}-${def.bpm.max})`);
  }

  // Add mood suggestions if available
  if (def.moods && def.moods.length > 0) {
    const shuffledMoods = shuffle([...def.moods], rng);
    const selectedMoods = shuffledMoods.slice(0, 3);
    lines.push(`Mood suggestions: ${selectedMoods.join(', ')}`);
  }

  // Add vocal suggestions
  const vocalDesc = buildVocalDescriptor(genre, rng);
  lines.push(`Vocal style: ${vocalDesc}`);

  // Add production suggestions
  const prodMulti = buildProductionDescriptorMulti(rng);
  const prodDesc = `${prodMulti.texture}, ${prodMulti.reverb}`;
  lines.push(`Production: ${prodDesc}`);

  // Add chord progression suggestion
  const progDesc = buildProgressionDescriptor(genre, rng);
  lines.push(`Chord progression: ${progDesc}`);

  lines.push('');

  if (userSelected.length > 0) {
    lines.push('User specified (MUST use):');
    lines.push(...userSelected.map(t => `- ${t}`));
  }

  // Apply articulations to suggested instruments
  const suggested = selected
    .filter(t => !userSelected.includes(t))
    .map(t => articulateInstrument(t, rng, APP_CONSTANTS.ARTICULATION_CHANCE));
    
  if (suggested.length > 0) {
    if (userSelected.length > 0) {
      lines.push('');
      lines.push('Suggested additions:');
    }
    lines.push(...suggested.map(t => `- ${t}`));
  }

  return lines.join('\n');
}

export function getAmbientInstruments(options?: InstrumentSelectionOptions): string {
  return getGenreInstruments('ambient', options);
}

export type ModeSelectionInput = {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  polyrhythmCombination: PolyrhythmCombinationType | null;
  timeSignature: TimeSignatureType | null;
  timeSignatureJourney: TimeSignatureJourneyType | null;
  reasoning: string;
};

export function buildGuidanceFromSelection(
  selection: ModeSelectionInput,
  options?: InstrumentSelectionOptions
): string {
  const rng = options?.rng ?? Math.random;
  const parts: string[] = [];

  if (selection.combination) {
    parts.push(getCombinationGuidance(selection.combination, rng));
  } else if (selection.singleMode) {
    parts.push(getHarmonicGuidance(selection.singleMode, rng));
  }

  if (selection.polyrhythmCombination) {
    parts.push(getPolyrhythmCombinationGuidance(selection.polyrhythmCombination));
  }

  if (selection.timeSignatureJourney) {
    parts.push(getTimeSignatureJourneyGuidance(selection.timeSignatureJourney));
  } else if (selection.timeSignature) {
    parts.push(getTimeSignatureGuidance(selection.timeSignature, rng));
  }

  if (selection.genre) {
    parts.push(getGenreInstruments(selection.genre, options));
  }

  return parts.join('\n\n');
}

/**
 * Get multi-genre nuance guidance for blended genres.
 * Formats BPM range, harmonic style, time signature, and polyrhythm suggestions
 * for compound genre strings.
 *
 * Only includes sections for detected nuances - returns null if no guidance generated.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns Formatted guidance string, or null if no nuances detected
 */
export function getMultiGenreNuanceGuidance(
  genreString: string,
  rng: Rng = Math.random
): string | null {
  const bpmRange = getBlendedBpmRange(genreString);

  const parts: string[] = [];

  // BPM Range (always include if available)
  if (bpmRange) {
    parts.push(`BPM Range: ${formatBpmRange(bpmRange)}`);
  }

  // Harmonic style suggestion
  const harmonicStyle = getBlendedHarmonicStyle(genreString, rng);
  if (harmonicStyle) {
    const style = HARMONIC_STYLES[harmonicStyle];
    parts.push(`Suggested harmonic style: ${style.name} (${style.description})`);
  }

  // Time signature suggestion
  const timeSignature = getBlendedTimeSignature(genreString, rng);
  if (timeSignature) {
    const sig = TIME_SIGNATURES[timeSignature];
    parts.push(`Suggested time signature: ${sig.signature} - ${sig.feel}`);
  }

  // Polyrhythm suggestion (only for applicable genres)
  const polyrhythm = getBlendedPolyrhythm(genreString, rng);
  if (polyrhythm) {
    const poly = POLYRHYTHMS[polyrhythm];
    parts.push(`Suggested polyrhythm: ${poly.name} (${poly.ratio}) - ${poly.description}`);
  }

  if (parts.length === 0) return null;

  return ['', 'MULTI-GENRE NUANCE:', ...parts].join('\n');
}
