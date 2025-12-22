export const SYNTH_REPLACEMENTS: Record<string, readonly string[]> = {
  'strings': ['synth strings', 'mellotron'],
  'choir': ['synth choir', 'mellotron', 'vocoder'],
  'wordless choir': ['synth choir', 'vocoder'],
  'trumpet': ['synth brass'],
  'trombone': ['synth brass'],
  'french horn': ['synth brass'],
  'flute': ['synth flute'],
  'bells': ['synth bells'],
  'glockenspiel': ['synth bells'],
  'celesta': ['synth bells'],
  'bass': ['synth bass', 'sub-bass'],
  'felt piano': ['synth piano', 'electric piano', 'Rhodes'],
  'acoustic guitar': ['guitar'],
  'violin': ['synth strings'],
  'cello': ['synth strings'],
  'viola': ['synth strings'],
  'oboe': ['synth flute'],
  'clarinet': ['synth flute'],
  'organ': ['Hammond organ'],
} as const;

export function getSynthAlternatives(instrument: string): readonly string[] {
  const lower = instrument.toLowerCase();
  for (const [acoustic, synths] of Object.entries(SYNTH_REPLACEMENTS)) {
    if (acoustic.toLowerCase() === lower) {
      return synths;
    }
  }
  return [];
}

export function hasSynthAlternative(instrument: string): boolean {
  return getSynthAlternatives(instrument).length > 0;
}

export function suggestSynthReplacement(instrument: string): string | null {
  const alternatives = getSynthAlternatives(instrument);
  if (alternatives.length === 0) return null;
  return alternatives[Math.floor(Math.random() * alternatives.length)] ?? null;
}

export function getAllSynthInstruments(): readonly string[] {
  return [
    'synth strings',
    'synth brass',
    'synth choir',
    'synth piano',
    'synth flute',
    'synth bells',
    'synth bass',
    'arpeggiator',
    'synth pad',
    'analog synth',
    'digital synth',
    'FM synth',
    'Moog synth',
    'synth',
    'crystalline synth pads',
    'ambient pad',
    '808',
    'vocoder',
    'mellotron',
  ] as const;
}
