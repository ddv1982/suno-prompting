import { describe, expect, test } from 'bun:test';

import {
  detectHarmonic,
  getHarmonicGuidance,
  detectRhythmic,
  detectAmbient,
  detectGenre,
  detectCombination,
  getCombinationGuidance,
  detectPolyrhythmCombination,
  getPolyrhythmCombinationGuidance,
  getGenreInstruments,

  getAmbientInstruments,
  GENRE_REGISTRY,
  extractInstruments,
  normalizeToken,
  matchInstrument,
  isValidInstrument,
  toCanonical,
  INSTRUMENT_REGISTRY,
} from '@bun/instruments';
import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  ORCHESTRAL_COLOR_INSTRUMENTS,
} from '@bun/instruments/datasets/instrument-classes';

describe('detectHarmonic', () => {
  // Lydian variants
  test('detects lydian_dominant for fusion keywords', () => {
    expect(detectHarmonic('fusion track')).toBe('lydian_dominant');
    expect(detectHarmonic('simpsons style')).toBe('lydian_dominant');
  });

  test('detects lydian_augmented for space/alien keywords', () => {
    expect(detectHarmonic('alien space vibes')).toBe('lydian_augmented');
    expect(detectHarmonic('supernatural atmosphere')).toBe('lydian_augmented');
  });

  test('detects lydian_sharp_two for enchanted keywords', () => {
    expect(detectHarmonic('enchanted melody')).toBe('lydian_sharp_two');
  });

  test('detects pure lydian for lydian/cinematic keywords', () => {
    expect(detectHarmonic('lydian mode')).toBe('lydian');
    expect(detectHarmonic('dreamy floating sound')).toBe('lydian');
    expect(detectHarmonic('cinematic score')).toBe('lydian');
  });

  // New modes
  test('detects ionian for major/happy keywords', () => {
    expect(detectHarmonic('happy uplifting song')).toBe('ionian');
    expect(detectHarmonic('major key melody')).toBe('ionian');
    expect(detectHarmonic('joyful and cheerful')).toBe('ionian');
  });

  test('detects mixolydian for bluesy/rock keywords', () => {
    expect(detectHarmonic('mixolydian groove')).toBe('mixolydian');
    expect(detectHarmonic('bluesy rock track')).toBe('mixolydian');
    expect(detectHarmonic('driving groovy beat')).toBe('mixolydian');
  });

  test('detects dorian for jazzy/soulful keywords', () => {
    expect(detectHarmonic('dorian jazz')).toBe('dorian');
    expect(detectHarmonic('soulful smooth vibes')).toBe('dorian');
    expect(detectHarmonic('funky groove')).toBe('dorian');
  });

  test('detects aeolian for minor/sad keywords', () => {
    expect(detectHarmonic('sad melancholic ballad')).toBe('aeolian');
    expect(detectHarmonic('emotional dramatic piece')).toBe('aeolian');
    expect(detectHarmonic('minor key melody')).toBe('aeolian');
  });

  test('detects phrygian for spanish/flamenco keywords', () => {
    expect(detectHarmonic('phrygian mode')).toBe('phrygian');
    expect(detectHarmonic('spanish flamenco')).toBe('phrygian');
    expect(detectHarmonic('middle eastern vibe')).toBe('phrygian');
    expect(detectHarmonic('metal riff')).toBe('phrygian');
  });

  test('detects locrian for horror/dissonant keywords', () => {
    expect(detectHarmonic('locrian scale')).toBe('locrian');
    expect(detectHarmonic('horror soundtrack')).toBe('locrian');
    expect(detectHarmonic('dissonant experimental')).toBe('locrian');
  });

  test('detects harmonic_minor for classical/gothic keywords', () => {
    expect(detectHarmonic('harmonic minor scale')).toBe('harmonic_minor');
    expect(detectHarmonic('gothic classical')).toBe('harmonic_minor');
    expect(detectHarmonic('vampire soundtrack')).toBe('harmonic_minor');
    expect(detectHarmonic('eastern european folk')).toBe('harmonic_minor');
  });

  test('detects melodic_minor for jazz/noir keywords', () => {
    expect(detectHarmonic('melodic minor mode')).toBe('melodic_minor');
    expect(detectHarmonic('jazz minor sound')).toBe('melodic_minor');
    expect(detectHarmonic('film noir soundtrack')).toBe('melodic_minor');
    expect(detectHarmonic('sophisticated smooth jazz')).toBe('melodic_minor');
  });

  test('returns null for no match', () => {
    expect(detectHarmonic('simple song')).toBeNull();
  });
});

describe('getHarmonicGuidance', () => {
  test('includes style name and key info', () => {
    const guidance = getHarmonicGuidance('lydian');
    expect(guidance).toContain('Pure Lydian');
    expect(guidance).toContain('Maj7#11');
    expect(guidance).toContain('Examples:');
  });

  test('includes bullet points', () => {
    const guidance = getHarmonicGuidance('lydian_dominant');
    expect(guidance.match(/^- /gm)?.length).toBeGreaterThanOrEqual(1);
  });

  test('includes dynamically selected instruments for all modes', () => {
    const guidance = getHarmonicGuidance('lydian');
    expect(guidance).toContain('Suggested instruments:');
  });

  test('includes instruments for new modes', () => {
    expect(getHarmonicGuidance('dorian')).toContain('Suggested instruments:');
    expect(getHarmonicGuidance('phrygian')).toContain('Suggested instruments:');
    expect(getHarmonicGuidance('aeolian')).toContain('Suggested instruments:');
    expect(getHarmonicGuidance('mixolydian')).toContain('Suggested instruments:');
    expect(getHarmonicGuidance('ionian')).toContain('Suggested instruments:');
  });

  test('includes instruments for minor scale variants', () => {
    expect(getHarmonicGuidance('harmonic_minor')).toContain('Suggested instruments:');
    expect(getHarmonicGuidance('melodic_minor')).toContain('Suggested instruments:');
  });
});

describe('detectRhythmic', () => {
  test('detects polyrhythm keywords', () => {
    expect(detectRhythmic('polyrhythm beat')).toBe('polyrhythm');
    expect(detectRhythmic('3:4 groove')).toBe('polyrhythm');
  });

  test('returns null for no match', () => {
    expect(detectRhythmic('simple beat')).toBeNull();
  });
});

describe('detectAmbient', () => {
  test('detects ambient keywords', () => {
    expect(detectAmbient('ambient soundscape')).toBe(true);
    expect(detectAmbient('atmospheric pads')).toBe(true);
  });

  test('returns false for no match', () => {
    expect(detectAmbient('heavy metal')).toBe(false);
  });
});

describe('detectGenre', () => {
  test('detects ambient genre', () => {
    expect(detectGenre('ambient soundscape')).toBe('ambient');
    expect(detectGenre('atmospheric pads')).toBe('ambient');
  });

  test('returns null for no match', () => {
    expect(detectGenre('random gibberish xyzzy')).toBeNull();
  });

  test('detects rock and metal as separate genres', () => {
    expect(detectGenre('heavy metal song')).toBe('metal');
    expect(detectGenre('rock anthem')).toBe('rock');
  });
});

describe('getGenreInstruments', () => {
  test('works for ambient genre', () => {
    const guidance = getGenreInstruments('ambient');
    expect(guidance).toContain('SUGGESTED INSTRUMENTS');
    expect(guidance).toContain('Ambient:');
  });

  test('respects user instruments', () => {
    const guidance = getGenreInstruments('ambient', { userInstruments: ['cello'] });
    expect(guidance).toContain('User specified (MUST use):');
    expect(guidance).toContain('- cello');
  });

  test('respects maxTags option', () => {
    const guidance = getGenreInstruments('ambient', { maxTags: 2 });
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});

describe('getAmbientInstruments', () => {
  function parseBullets(guidance: string): string[] {
    return guidance
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.slice(2));
  }

  test('includes genre header and description', () => {
    const guidance = getAmbientInstruments();
    expect(guidance).toContain('SUGGESTED INSTRUMENTS (Suno tags)');
    expect(guidance).toContain('Ambient:');
    expect(guidance.toLowerCase()).toContain('immersive electronic soundscapes');
  });

  test('picks 2-5 Suno canonical tags', () => {
    const guidance = getAmbientInstruments();
    const tags = parseBullets(guidance);
    expect(tags.length).toBeGreaterThanOrEqual(2);
    expect(tags.length).toBeLessThanOrEqual(5);

    const ambientPools = GENRE_REGISTRY.ambient.pools;
    const whitelist = [
      ...Object.values(ambientPools).flatMap(p => [...p.instruments]),
      ...MULTIGENRE_INSTRUMENTS,
      ...FOUNDATIONAL_INSTRUMENTS,
      ...ORCHESTRAL_COLOR_INSTRUMENTS,
    ];
    // Tags may have articulations prepended (e.g., "Arpeggiated Rhodes")
    // Check if the tag contains any whitelisted instrument
    for (const tag of tags) {
      const hasValidInstrument = whitelist.some(inst => tag.includes(inst));
      expect(hasValidInstrument).toBe(true);
    }
  });

  test('returns different instruments on multiple calls (random)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getAmbientInstruments());
    }
    expect(results.size).toBeGreaterThan(1);
  });

  test('never includes both acoustic piano and Rhodes (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      const hasPiano = guidance.includes('acoustic piano');
      const hasRhodes = guidance.includes('rhodes');
      expect(hasPiano && hasRhodes).toBe(false);
    }
  });

  test('never includes both Rhodes and Wurlitzer (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      const hasRhodes = guidance.includes('rhodes');
      const hasWurli = guidance.includes('wurlitzer');
      expect(hasRhodes && hasWurli).toBe(false);
    }
  });

  test('never includes both bells and singing bowls (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      // Check for "- bells" as bullet to avoid matching "glass bells"
      const hasBells = guidance.includes('- bells') || (/^bells$/m.exec(guidance)) !== null;
      const hasBowls = guidance.includes('singing bowls');
      expect(hasBells && hasBowls).toBe(false);
    }
  });

  test('always includes a pads and a texture tag', () => {
    const pools = GENRE_REGISTRY.ambient.pools;
    const padsInstruments = pools.pads!.instruments;
    const textureInstruments = pools.texture!.instruments;

    // Check if tag contains any of the instruments (handles articulations like "Arpeggiated synth pad")
    const containsInstrument = (tag: string, instruments: readonly string[]) =>
      instruments.some(inst => tag.includes(inst));

    for (let i = 0; i < 30; i++) {
      const guidance = getAmbientInstruments();
      const tags = parseBullets(guidance);
      expect(tags.some(t => containsInstrument(t, padsInstruments))).toBe(true);
      expect(tags.some(t => containsInstrument(t, textureInstruments))).toBe(true);
    }
  });

  test('prioritizes user-provided instruments', () => {
    const guidance = getAmbientInstruments({ userInstruments: ['piano', 'violin'] });
    expect(guidance).toContain('User specified (MUST use):');
    expect(guidance).toContain('- piano');
    expect(guidance).toContain('- violin');
  });

  test('fills remaining slots after user instruments', () => {
    const guidance = getAmbientInstruments({ userInstruments: ['cello'] });
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  test('respects maxTags option', () => {
    const guidance = getAmbientInstruments({ maxTags: 2 });
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});

describe('instrument registry', () => {
  test('registry has entries for all categories', () => {
    const categories = new Set(INSTRUMENT_REGISTRY.map(e => e.category));
    expect(categories.has('harmonic')).toBe(true);
    expect(categories.has('pad')).toBe(true);
    expect(categories.has('color')).toBe(true);
    expect(categories.has('movement')).toBe(true);
    expect(categories.has('rare')).toBe(true);
  });

  test('isValidInstrument returns true for canonical names', () => {
    expect(isValidInstrument('felt piano')).toBe(true);
    expect(isValidInstrument('synth pad')).toBe(true);
    expect(isValidInstrument('cello')).toBe(true);
  });

  test('isValidInstrument returns true for aliases', () => {
    expect(isValidInstrument('piano')).toBe(true);
    expect(isValidInstrument('keys')).toBe(true);
    expect(isValidInstrument('fiddle')).toBe(true);
  });

  test('isValidInstrument is case-insensitive', () => {
    expect(isValidInstrument('Piano')).toBe(true);
    expect(isValidInstrument('PIANO')).toBe(true);
    expect(isValidInstrument('PiAnO')).toBe(true);
  });

  test('isValidInstrument returns false for unknown instruments', () => {
    expect(isValidInstrument('kazoo')).toBe(false);
    expect(isValidInstrument('bagpipes')).toBe(false);
  });

  test('toCanonical converts aliases to canonical names', () => {
    expect(toCanonical('piano')).toBe('felt piano');
    expect(toCanonical('keys')).toBe('felt piano');
    expect(toCanonical('fiddle')).toBe('fiddle');
    expect(toCanonical('vibes')).toBe('vibraphone');
  });

  test('toCanonical returns null for unknown instruments', () => {
    expect(toCanonical('kazoo')).toBeNull();
    expect(toCanonical('bagpipes')).toBeNull();
  });
});

describe('normalizeToken', () => {
  test('lowercases and trims', () => {
    expect(normalizeToken('  Piano  ')).toBe('piano');
    expect(normalizeToken('GUITAR')).toBe('guitar');
  });

  test('removes special characters', () => {
    expect(normalizeToken('piano!')).toBe('piano');
    expect(normalizeToken('(guitar)')).toBe('guitar');
  });

  test('normalizes whitespace', () => {
    expect(normalizeToken('felt   piano')).toBe('felt piano');
  });
});

describe('matchInstrument', () => {
  test('matches canonical names', () => {
    expect(matchInstrument('felt piano')).toBe('felt piano');
    expect(matchInstrument('cello')).toBe('cello');
  });

  test('matches aliases to canonical', () => {
    expect(matchInstrument('piano')).toBe('felt piano');
    expect(matchInstrument('keys')).toBe('felt piano');
    expect(matchInstrument('fiddle')).toBe('fiddle');
  });

  test('handles articles', () => {
    expect(matchInstrument('a piano')).toBe('felt piano');
    expect(matchInstrument('the guitar')).toBe('guitar');
  });

  test('returns null for non-instruments', () => {
    expect(matchInstrument('happy')).toBeNull();
    expect(matchInstrument('loud')).toBeNull();
  });
});

describe('extractInstruments', () => {
  test('extracts instruments from "with" phrases', () => {
    const result = extractInstruments('An ambient track with piano and cello');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('cello');
  });

  test('extracts instruments from "featuring" phrases', () => {
    const result = extractInstruments('A soundscape featuring strings and synth');
    expect(result.found).toContain('strings');
    expect(result.found).toContain('synth');
  });

  test('extracts multiple instruments from comma-separated list', () => {
    const result = extractInstruments('Using piano, guitar, and drums');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('guitar');
    expect(result.found).toContain('drums');
  });

  test('handles aliases and converts to canonical', () => {
    const result = extractInstruments('A track with keys and fiddle');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('fiddle');
  });

  test('returns empty array for no instruments', () => {
    const result = extractInstruments('A happy upbeat song');
    expect(result.found).toHaveLength(0);
  });

  test('deduplicates instruments', () => {
    const result = extractInstruments('Piano with piano and more piano');
    const pianoCount = result.found.filter(i => i === 'felt piano').length;
    expect(pianoCount).toBe(1);
  });

  test('handles complex descriptions', () => {
    const result = extractInstruments(
      'Create an atmospheric ambient track featuring lush strings and ethereal synth pads, with subtle piano melodies'
    );
    expect(result.found).toContain('strings');
    expect(result.found).toContain('synth pad');
    expect(result.found).toContain('felt piano');
  });
});

describe('detectCombination', () => {
  test('detects major_minor for bittersweet keywords', () => {
    expect(detectCombination('bittersweet ballad')).toBe('major_minor');
    expect(detectCombination('happy sad song')).toBe('major_minor');
    expect(detectCombination('emotional major key')).toBe('major_minor');
  });

  test('detects lydian_minor for dreamy dark keywords', () => {
    expect(detectCombination('lydian minor vibes')).toBe('lydian_minor');
    expect(detectCombination('floating dark atmosphere')).toBe('lydian_minor');
    expect(detectCombination('cinematic tension score')).toBe('lydian_minor');
  });

  test('detects lydian_major for floating happy keywords', () => {
    expect(detectCombination('lydian major sound')).toBe('lydian_major');
    expect(detectCombination('bright uplifting track')).toBe('lydian_major');
  });

  test('detects dorian_lydian for jazz fusion keywords', () => {
    expect(detectCombination('jazz fusion track')).toBe('dorian_lydian');
    expect(detectCombination('sophisticated groove')).toBe('dorian_lydian');
  });

  test('detects harmonic_major for classical drama keywords', () => {
    expect(detectCombination('classical drama')).toBe('harmonic_major');
    expect(detectCombination('gothic triumph ending')).toBe('harmonic_major');
  });

  test('detects minor_journey for evolving minor keywords', () => {
    expect(detectCombination('minor journey')).toBe('minor_journey');
    expect(detectCombination('evolving minor sound')).toBe('minor_journey');
  });

  test('detects lydian_exploration for all lydian keywords', () => {
    expect(detectCombination('lydian exploration')).toBe('lydian_exploration');
    expect(detectCombination('all lydian modes')).toBe('lydian_exploration');
  });

  test('detects major_modes for major exploration keywords', () => {
    expect(detectCombination('major modes')).toBe('major_modes');
    expect(detectCombination('bright to bluesy')).toBe('major_modes');
  });

  test('detects dark_modes for descending darkness keywords', () => {
    expect(detectCombination('dark modes')).toBe('dark_modes');
    expect(detectCombination('darker and darker')).toBe('dark_modes');
  });

  test('returns null for no match', () => {
    expect(detectCombination('simple pop song')).toBeNull();
  });
});

describe('getCombinationGuidance', () => {
  test('includes combination name and description', () => {
    const guidance = getCombinationGuidance('major_minor');
    expect(guidance).toContain('Major-Minor (Bittersweet)');
    expect(guidance).toContain('Happy foundation');
  });

  test('includes emotional arc', () => {
    const guidance = getCombinationGuidance('lydian_minor');
    expect(guidance).toContain('Emotional Arc:');
    expect(guidance).toContain('Wonder');
  });

  test('includes borrowed chords for cross-mode combinations', () => {
    const guidance = getCombinationGuidance('major_minor');
    expect(guidance).toContain('Borrowed chords:');
    expect(guidance).toContain('bVI');
  });

  test('includes suggested progressions', () => {
    const guidance = getCombinationGuidance('dorian_lydian');
    expect(guidance).toContain('Suggested progressions:');
    expect(guidance).toContain('-');
  });

  test('includes famous examples when available', () => {
    const guidance = getCombinationGuidance('major_minor');
    expect(guidance).toContain('Famous examples:');
    expect(guidance).toContain('Beatles');
  });

  test('includes best instruments', () => {
    const guidance = getCombinationGuidance('harmonic_major');
    expect(guidance).toContain('Best instruments:');
    expect(guidance).toContain('strings');
  });

  test('works for within-mode combinations', () => {
    const guidance = getCombinationGuidance('minor_journey');
    expect(guidance).toContain('Minor Scale Journey');
    expect(guidance).toContain('Emotional Arc:');
    expect(guidance).toContain('Best instruments:');
  });

  test('includes section guide for 3-phase combinations', () => {
    const guidance = getCombinationGuidance('lydian_exploration');
    expect(guidance).toContain('SECTION GUIDE:');
    expect(guidance).toContain('INTRO/VERSE:');
    expect(guidance).toContain('CHORUS:');
    expect(guidance).toContain('BRIDGE/OUTRO:');
    expect(guidance).toContain('Lydian dream');
    expect(guidance).toContain('Dominant groove');
    expect(guidance).toContain('Augmented cosmos');
  });

  test('includes section guide for 2-phase combinations', () => {
    const guidance = getCombinationGuidance('major_minor');
    expect(guidance).toContain('SECTION GUIDE:');
    expect(guidance).toContain('INTRO/VERSE:');
    expect(guidance).toContain('CHORUS/BRIDGE/OUTRO:');
    expect(guidance).toContain('Major brightness');
    expect(guidance).toContain('Minor shadow');
  });
});

describe('detectPolyrhythmCombination', () => {
  test('detects complexity_build for building polyrhythm keywords', () => {
    expect(detectPolyrhythmCombination('building polyrhythm')).toBe('complexity_build');
    expect(detectPolyrhythmCombination('evolving rhythm')).toBe('complexity_build');
  });

  test('detects triplet_exploration for jazzy rhythm keywords', () => {
    expect(detectPolyrhythmCombination('triplet exploration')).toBe('triplet_exploration');
    expect(detectPolyrhythmCombination('triplet journey')).toBe('triplet_exploration');
  });

  test('detects odd_journey for prog rhythm keywords', () => {
    expect(detectPolyrhythmCombination('odd journey')).toBe('odd_journey');
    expect(detectPolyrhythmCombination('prog rhythm')).toBe('odd_journey');
  });

  test('detects tension_arc for tension release keywords', () => {
    expect(detectPolyrhythmCombination('tension arc')).toBe('tension_arc');
    expect(detectPolyrhythmCombination('build and resolve')).toBe('tension_arc');
  });

  test('detects groove_to_drive for energy build keywords', () => {
    expect(detectPolyrhythmCombination('groove to drive')).toBe('groove_to_drive');
    expect(detectPolyrhythmCombination('dance build')).toBe('groove_to_drive');
  });

  test('detects tension_release for drop keywords', () => {
    expect(detectPolyrhythmCombination('tension release')).toBe('tension_release');
  });

  test('returns null for no match', () => {
    expect(detectPolyrhythmCombination('simple beat')).toBeNull();
  });
});

describe('getPolyrhythmCombinationGuidance', () => {
  test('includes combination name and description', () => {
    const guidance = getPolyrhythmCombinationGuidance('complexity_build');
    expect(guidance).toContain('Complexity Build');
    expect(guidance).toContain('Groove → Drive → Chaos');
  });

  test('includes section guide for 3-phase combinations', () => {
    const guidance = getPolyrhythmCombinationGuidance('complexity_build');
    expect(guidance).toContain('SECTION GUIDE:');
    expect(guidance).toContain('INTRO/VERSE:');
    expect(guidance).toContain('CHORUS:');
    expect(guidance).toContain('BRIDGE/OUTRO:');
    expect(guidance).toContain('Hemiola');
    expect(guidance).toContain('Afrobeat');
  });

  test('includes section guide for 2-phase combinations', () => {
    const guidance = getPolyrhythmCombinationGuidance('groove_to_drive');
    expect(guidance).toContain('SECTION GUIDE:');
    expect(guidance).toContain('INTRO/VERSE:');
    expect(guidance).toContain('CHORUS/BRIDGE/OUTRO:');
  });

  test('includes emotional arc', () => {
    const guidance = getPolyrhythmCombinationGuidance('tension_arc');
    expect(guidance).toContain('Emotional Arc:');
    expect(guidance).toContain('Drive');
  });

  test('includes best instruments', () => {
    const guidance = getPolyrhythmCombinationGuidance('odd_journey');
    expect(guidance).toContain('Best instruments:');
    expect(guidance).toContain('drums');
  });
});

