export { HARMONIC_STYLES } from '@bun/instruments/modes';
export type { HarmonicStyle } from '@bun/instruments/modes';

export const RHYTHMIC_STYLES = {
  polyrhythm: {
    name: 'Polyrhythm',
    keywords: ['polyrhythm', 'poly rhythm', 'poly-rhythm', 'cross rhythm', 'cross-rhythm', '2:3', '3:4', '4:3', '5:4', '7:4', 'interlocking rhythm'],
    description: 'Interlocking, hypnotic rhythmic complexity',
    characteristics: [
      'Layer conflicting rhythmic divisions simultaneously',
      'Creates hypnotic, trance-like quality',
      'African-influenced interlocking patterns',
      'Organic, alive feel - rhythms shift and interweave',
      'Use cross-rhythms between percussion, bass, and melodic elements',
    ],
    commonRatios: '2:3 (hemiola/swing), 3:4 (tension/limping), 4:3 (Afrobeat drive), 5:4 (complex shifting), 7:4 (constantly evolving)',
    instruments: 'Layered percussion, polyrhythmic bass lines, interlocking synth arpeggios, cross-rhythm hi-hats',
  },
} as const;

export type RhythmicStyle = keyof typeof RHYTHMIC_STYLES;
