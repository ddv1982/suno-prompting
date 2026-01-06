/**
 * Emotion and sentiment word lists for title generation
 *
 * Contains emotion-based words and mood weight mappings for
 * generating contextually appropriate titles.
 *
 * @module prompt/title/datasets/emotions
 */

/** Emotion-based words */
export const EMOTION_WORDS: readonly string[] = [
  'Dream',
  'Memory',
  'Echo',
  'Shadow',
  'Light',
  'Hope',
  'Heart',
  'Soul',
  'Spirit',
  'Silence',
  'Whisper',
  'Cry',
  'Love',
  'Lost',
  'Found',
];

/** Action/movement words */
export const ACTION_WORDS: readonly string[] = [
  'Rising',
  'Falling',
  'Burning',
  'Fading',
  'Running',
  'Dancing',
  'Flying',
  'Drifting',
  'Breaking',
  'Chasing',
];

/** Mood-based word preferences */
export const MOOD_WORD_WEIGHTS: Record<string, { preferred: readonly string[]; avoid: readonly string[] }> = {
  melancholic: {
    preferred: ['Shadow', 'Rain', 'Memory', 'Echo', 'Fading', 'Lost', 'Silence', 'Twilight'],
    avoid: ['Joy', 'Bright', 'Happy', 'Dancing'],
  },
  upbeat: {
    preferred: ['Sun', 'Light', 'Rising', 'Dancing', 'Hope', 'Morning', 'Fire', 'Flying'],
    avoid: ['Shadow', 'Lost', 'Falling', 'Cry'],
  },
  aggressive: {
    preferred: ['Thunder', 'Storm', 'Fire', 'Breaking', 'Burning', 'Chaos', 'Rising'],
    avoid: ['Gentle', 'Soft', 'Whisper', 'Floating'],
  },
  calm: {
    preferred: ['Ocean', 'Moon', 'Silence', 'Drifting', 'Serenity', 'Gentle', 'Stars'],
    avoid: ['Thunder', 'Breaking', 'Burning', 'Chaos'],
  },
  romantic: {
    preferred: ['Heart', 'Love', 'Moon', 'Stars', 'Dream', 'Whisper', 'Evening'],
    avoid: ['Chaos', 'Breaking', 'Thunder', 'Lost'],
  },
  dark: {
    preferred: ['Shadow', 'Night', 'Midnight', 'Storm', 'Thunder', 'Chaos', 'Silence'],
    avoid: ['Sun', 'Morning', 'Light', 'Hope'],
  },
  energetic: {
    preferred: ['Fire', 'Rising', 'Running', 'Dancing', 'Thunder', 'Burning', 'Flying'],
    avoid: ['Silence', 'Drifting', 'Fading', 'Floating'],
  },
  dreamy: {
    preferred: ['Dream', 'Stars', 'Moon', 'Floating', 'Drifting', 'Ethereal', 'Twilight'],
    avoid: ['Thunder', 'Breaking', 'Burning', 'Chaos'],
  },
};
