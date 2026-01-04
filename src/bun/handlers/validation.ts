import { VALID_CREATIVITY_LEVELS } from '@shared/constants';
import { ValidationError } from '@shared/errors';

export const MAX_SUNO_STYLES = 4;
export const MAX_SEED_GENRES = 4;

export function validateSunoStylesLimit(sunoStyles: string[]): void {
  if (sunoStyles.length > MAX_SUNO_STYLES) {
    throw new ValidationError(`Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`, 'sunoStyles');
  }
}

export function validateSeedGenresLimit(seedGenres: string[]): void {
  if (seedGenres.length > MAX_SEED_GENRES) {
    throw new ValidationError(`Maximum ${MAX_SEED_GENRES} seed genres allowed`, 'seedGenres');
  }
}

export function validateCategoryStylesMutualExclusivity(
  category: unknown,
  sunoStyles: string[]
): void {
  if (category !== null && sunoStyles.length > 0) {
    throw new ValidationError(
      'Cannot use both Category and Suno V5 Styles. Please select only one.',
      'sunoStyles'
    );
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

export function validateCreativityLevel(level: number): void {
  if (!VALID_CREATIVITY_LEVELS.includes(level as typeof VALID_CREATIVITY_LEVELS[number])) {
    throw new ValidationError(
      'Invalid creativity level. Must be 0, 25, 50, 75, or 100',
      'creativityLevel'
    );
  }
}

export function validateRequiredField(value: string | undefined, fieldName: string, message: string): void {
  if (!value?.trim()) {
    throw new ValidationError(message, fieldName);
  }
}
