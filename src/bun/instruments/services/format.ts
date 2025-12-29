import { HARMONIC_STYLES, ALL_COMBINATIONS, selectInstrumentsForMode } from '@bun/instruments/modes';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType } from '@bun/instruments/genres';
import { ALL_POLYRHYTHM_COMBINATIONS, TIME_SIGNATURES, TIME_SIGNATURE_JOURNEYS } from '@bun/instruments/rhythms';
import type { PolyrhythmCombinationType, TimeSignatureType, TimeSignatureJourneyType } from '@bun/instruments/rhythms';
import { RHYTHMIC_STYLES } from '@bun/instruments/datasets/rhythm';
import type { RhythmicStyle } from '@bun/instruments/datasets/rhythm';
import type { Rng } from '@bun/instruments/services/random';
import { shuffle, pickRandom } from '@bun/instruments/services/random';
import { selectInstrumentsForGenre, type InstrumentSelectionOptions } from '@bun/instruments/services/select';
import { articulateInstrument } from '@bun/prompt/articulations';

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
    `Suggested Progression: ${prog}`,
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
    `Grouping: ${grouping}`,
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

  lines.push('');

  if (userSelected.length > 0) {
    lines.push('User specified (MUST use):');
    lines.push(...userSelected.map(t => `- ${t}`));
  }

  // Apply articulations to suggested instruments (40% chance per instrument)
  const suggested = selected
    .filter(t => !userSelected.includes(t))
    .map(t => articulateInstrument(t, rng, 0.4));
    
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
