import { LYDIAN_MODES } from './lydian';
import { MAJOR_MODES } from './major';
import { MINOR_MODES } from './minor';

export const HARMONIC_STYLES = {
  ...LYDIAN_MODES,
  ...MAJOR_MODES,
  ...MINOR_MODES,
} as const;

export type HarmonicStyle = keyof typeof HARMONIC_STYLES;

export { LYDIAN_MODES, MAJOR_MODES, MINOR_MODES };

export {
  CROSS_MODE_COMBINATIONS,
  WITHIN_MODE_COMBINATIONS,
  ALL_COMBINATIONS,
} from './combinations';
export type { CombinationType, CrossModeCombination, WithinModeCombination } from './combinations';
