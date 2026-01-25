import { ValidationError } from '@shared/errors';
import { MAX_SUNO_STYLES } from '@shared/schemas/common';

export function validateSunoStylesLimit(sunoStyles: string[]): void {
  if (sunoStyles.length > MAX_SUNO_STYLES) {
    throw new ValidationError(`Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`, 'sunoStyles');
  }
}

export function validateGenreStylesMutualExclusivity(
  seedGenres: string[],
  sunoStyles: string[]
): void {
  if (seedGenres.length > 0 && sunoStyles.length > 0) {
    throw new ValidationError(
      'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
      'sunoStyles'
    );
  }
}
