export type InstrumentCategory = 'harmonic' | 'pad' | 'color' | 'movement' | 'rare';

export type InstrumentEntry = {
  readonly canonical: string;
  readonly category: InstrumentCategory;
  readonly aliases: readonly string[];
};

export const INSTRUMENT_REGISTRY: readonly InstrumentEntry[] = [
  // Harmonic anchors
  { canonical: 'prepared piano', category: 'harmonic', aliases: ['prepared piano'] },
  { canonical: 'felt piano', category: 'harmonic', aliases: ['piano', 'keys', 'soft piano', 'muted piano'] },
  { canonical: 'harmonium', category: 'harmonic', aliases: ['pump organ'] },
  { canonical: 'celesta', category: 'harmonic', aliases: ['celeste'] },
  { canonical: 'strings', category: 'harmonic', aliases: ['string section', 'orchestral strings', 'string ensemble'] },
  { canonical: 'guitar', category: 'harmonic', aliases: ['electric guitar', 'clean guitar'] },
  { canonical: 'acoustic guitar', category: 'harmonic', aliases: ['nylon guitar', 'classical guitar', 'folk guitar'] },
  { canonical: 'fretless guitar', category: 'harmonic', aliases: [] },

  // Pads and synths
  { canonical: 'synth pad', category: 'pad', aliases: ['pad', 'pads', 'synth pads'] },
  { canonical: 'analog synth pads', category: 'pad', aliases: ['analog pads', 'warm pads'] },
  { canonical: 'analog synth', category: 'pad', aliases: ['analog synthesizer', 'analogue synth'] },
  { canonical: 'digital synth', category: 'pad', aliases: ['digital synthesizer'] },
  { canonical: 'FM synth', category: 'pad', aliases: ['FM synthesis', 'DX7'] },
  { canonical: 'Moog synth', category: 'pad', aliases: ['Moog', 'Minimoog'] },
  { canonical: 'synth', category: 'pad', aliases: ['synthesizer', 'synths'] },
  { canonical: 'crystalline synth pads', category: 'pad', aliases: ['crystal pads', 'glassy pads'] },
  { canonical: 'ambient pad', category: 'pad', aliases: ['atmospheric pad', 'drone pad'] },

  // Rare instruments
  { canonical: 'taiko drums', category: 'rare', aliases: ['taiko', 'japanese drums'] },
  { canonical: 'steel pan', category: 'rare', aliases: ['steel drum', 'steelpan', 'steel drums'] },
  { canonical: 'Hammond organ', category: 'rare', aliases: ['Hammond', 'B3 organ', 'organ'] },

  // Color instruments
  { canonical: 'electric piano', category: 'color', aliases: ['e-piano', 'epiano'] },
  { canonical: 'Rhodes', category: 'color', aliases: ['Fender Rhodes', 'Rhodes piano'] },
  { canonical: 'Wurlitzer', category: 'color', aliases: ['Wurly', 'Wurlitzer piano'] },
  { canonical: 'Clavinet', category: 'color', aliases: ['Clav'] },
  { canonical: 'cello', category: 'color', aliases: ['violoncello'] },
  { canonical: 'violin', category: 'color', aliases: ['fiddle', 'violins'] },
  { canonical: 'viola', category: 'color', aliases: ['violas'] },
  { canonical: 'vibraphone', category: 'color', aliases: ['vibes', 'vibraharp'] },
  { canonical: 'oboe', category: 'color', aliases: [] },
  { canonical: 'bassoon', category: 'color', aliases: [] },
  { canonical: 'bowed vibraphone', category: 'color', aliases: [] },
  { canonical: 'marimba', category: 'color', aliases: [] },
  { canonical: 'kalimba', category: 'color', aliases: ['thumb piano', 'mbira'] },
  { canonical: 'glockenspiel', category: 'color', aliases: ['glock', 'orchestra bells'] },
  { canonical: 'bells', category: 'color', aliases: ['bell', 'chimes'] },
  { canonical: 'glass bells', category: 'color', aliases: ['crystal bells'] },
  { canonical: 'congas', category: 'color', aliases: ['conga', 'conga drums'] },
  { canonical: 'singing bowls', category: 'color', aliases: ['tibetan bowls', 'meditation bowls'] },
  { canonical: 'choir', category: 'color', aliases: ['vocals', 'voices', 'choral'] },
  { canonical: 'wordless choir', category: 'color', aliases: ['aahs', 'oohs', 'vocal pads'] },
  { canonical: 'clarinet', category: 'color', aliases: [] },
  { canonical: 'shakuhachi', category: 'color', aliases: ['japanese flute'] },
  { canonical: 'duduk', category: 'color', aliases: ['armenian duduk'] },
  { canonical: 'breathy EWI', category: 'color', aliases: ['EWI', 'wind controller'] },
  { canonical: 'flute', category: 'color', aliases: ['concert flute', 'western flute'] },
  { canonical: 'harp', category: 'color', aliases: ['concert harp', 'pedal harp'] },
  { canonical: 'trumpet', category: 'color', aliases: ['muted trumpet'] },
  { canonical: 'saxophone', category: 'color', aliases: ['sax', 'alto sax', 'tenor sax', 'soprano sax'] },
  { canonical: 'french horn', category: 'color', aliases: ['horn', 'horns'] },
  { canonical: 'trombone', category: 'color', aliases: [] },

  // Movement instruments
  { canonical: 'percussion', category: 'movement', aliases: ['perc'] },
  { canonical: 'toms', category: 'movement', aliases: ['tom drums', 'floor toms'] },
  { canonical: 'shaker', category: 'movement', aliases: ['shakers', 'egg shaker'] },
  { canonical: 'frame drum', category: 'movement', aliases: ['bodhran', 'tar'] },
  { canonical: 'handpan', category: 'movement', aliases: ['hang drum', 'hang'] },
  { canonical: 'sub-bass', category: 'movement', aliases: ['sub bass', 'subbass', 'deep bass'] },
  { canonical: 'snare drum', category: 'movement', aliases: ['snare'] },
  { canonical: 'jazz brushes', category: 'movement', aliases: ['brushes', 'brush drums'] },
  { canonical: 'cajón', category: 'movement', aliases: ['cajon', 'box drum'] },
  { canonical: 'djembe', category: 'movement', aliases: ['djembe drum'] },
  { canonical: 'bass', category: 'movement', aliases: ['bass guitar', 'electric bass', 'upright bass', 'double bass'] },
  { canonical: 'drums', category: 'movement', aliases: ['drum kit', 'drumkit', 'drum set'] },
  { canonical: 'hi-hat', category: 'movement', aliases: ['hi-hats', 'hihat', 'hihats'] },
  { canonical: 'kick drum', category: 'movement', aliases: ['kick', 'bass drum'] },
] as const;

// Build lookup maps at module load time
function buildLookupMaps() {
  const canonicalSet = new Set<string>();
  const aliasToCanonical = new Map<string, string>();

  for (const entry of INSTRUMENT_REGISTRY) {
    const canonicalLower = entry.canonical.toLowerCase();
    canonicalSet.add(canonicalLower);
    aliasToCanonical.set(canonicalLower, entry.canonical);

    for (const alias of entry.aliases) {
      aliasToCanonical.set(alias.toLowerCase(), entry.canonical);
    }
  }

  return { canonicalSet, aliasToCanonical };
}

const { canonicalSet, aliasToCanonical } = buildLookupMaps();

export const CANONICAL_SET: ReadonlySet<string> = canonicalSet;
export const ALIAS_TO_CANONICAL: ReadonlyMap<string, string> = aliasToCanonical;

export function isValidInstrument(name: string): boolean {
  return aliasToCanonical.has(name.toLowerCase());
}

export function toCanonical(name: string): string | null {
  return aliasToCanonical.get(name.toLowerCase()) ?? null;
}

export function getCategory(canonical: string): InstrumentCategory | null {
  const entry = INSTRUMENT_REGISTRY.find(e => e.canonical === canonical);
  return entry?.category ?? null;
}

export function getInstrumentsByCategory(category: InstrumentCategory): readonly string[] {
  return INSTRUMENT_REGISTRY
    .filter(e => e.category === category)
    .map(e => e.canonical);
}
