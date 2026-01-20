/**
 * Era-Tagged Instruments
 *
 * Defines instrument pools organized by musical era for period-specific
 * instrument selection. Each era has ~10 signature instruments that define
 * its sonic character.
 *
 * @module instruments/eras
 */

/**
 * Musical era identifier for period-specific instruments.
 */
export type InstrumentEra = '70s' | '80s' | '90s' | 'modern';

/**
 * Era-specific instrument pools.
 * Each era contains signature instruments that define its sonic character.
 */
export const ERA_INSTRUMENTS: Record<InstrumentEra, readonly string[]> = {
  '70s': [
    'Moog synthesizer',
    'Rhodes',
    'disco strings',
    'funk bass',
    'wah guitar',
    'clavinet',
    'Fender Rhodes',
    'ARP Odyssey',
    'Mellotron',
    'Hohner clavinet',
    'analog strings',
    'Prophet-5',
  ],
  '80s': [
    'DX7',
    'LinnDrum',
    'Juno pads',
    'gated reverb drums',
    'Simmons drums',
    'Fairlight CMI',
    'Oberheim OB-X',
    'Roland Jupiter-8',
    'PPG Wave',
    'synth brass',
    'Roland D-50',
    'E-mu Emulator',
  ],
  '90s': [
    'TB-303',
    'breakbeats',
    'grunge distortion',
    'jungle breaks',
    'Roland TR-909',
    'Supersaw',
    'Korg M1',
    'sampled vocals',
    'big beat drums',
    'trip hop beats',
    'Roland JV-1080',
    'Amen break',
  ],
  modern: [
    'Serum',
    'Omnisphere',
    'Massive X',
    'Kontakt',
    'Analog Lab',
    'neural amp',
    'granular synth',
    'wavetable',
    'Vital',
    'Splice samples',
    'Arturia V Collection',
    'Plugin Alliance',
  ],
};

/**
 * All available eras for iteration.
 */
export const INSTRUMENT_ERAS: readonly InstrumentEra[] = ['70s', '80s', '90s', 'modern'] as const;

/**
 * Select era-appropriate instruments with randomization.
 * Uses Fisher-Yates shuffle for fair selection.
 *
 * @param era - Target era for instrument selection
 * @param count - Number of instruments to select (default: 3)
 * @param rng - Random number generator function (default: Math.random)
 * @returns Array of selected instrument names
 */
export function selectEraInstruments(
  era: InstrumentEra,
  count = 3,
  rng: () => number = Math.random,
): string[] {
  const pool = ERA_INSTRUMENTS[era];
  const available = [...pool];
  const selected: string[] = [];

  // Limit count to available instruments
  const maxCount = Math.min(count, available.length);

  // Fisher-Yates shuffle and pick
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.floor(rng() * available.length);
    const instrument = available[idx];
    if (instrument) {
      selected.push(instrument);
      // Remove selected instrument to avoid duplicates
      available.splice(idx, 1);
    }
  }

  return selected;
}

/**
 * Get all instruments for a specific era.
 *
 * @param era - Target era
 * @returns Readonly array of all instruments for the era
 */
export function getEraInstruments(era: InstrumentEra): readonly string[] {
  return ERA_INSTRUMENTS[era];
}

/**
 * Check if an instrument belongs to a specific era.
 *
 * @param instrument - Instrument name to check
 * @param era - Era to check against
 * @returns True if the instrument is associated with the era
 */
export function isEraInstrument(instrument: string, era: InstrumentEra): boolean {
  return ERA_INSTRUMENTS[era].some(
    (eraInstrument) => eraInstrument.toLowerCase() === instrument.toLowerCase(),
  );
}

/**
 * Get the era(s) an instrument belongs to.
 *
 * @param instrument - Instrument name to look up
 * @returns Array of eras this instrument is associated with
 */
export function getInstrumentEras(instrument: string): InstrumentEra[] {
  const normalizedInstrument = instrument.toLowerCase();
  return INSTRUMENT_ERAS.filter((era) =>
    ERA_INSTRUMENTS[era].some((eraInstrument) => eraInstrument.toLowerCase() === normalizedInstrument),
  );
}
