// Named chord progressions based on professional prompt patterns
// These add harmonic structure guidance to prompts

export type ChordProgression = {
  readonly name: string;
  readonly pattern: string;
  readonly numerals: string;
  readonly mood: readonly string[];
  readonly genres: readonly string[];
  readonly description: string;
};

// Pop Essentials
export const POP_PROGRESSIONS: Record<string, ChordProgression> = {
  the_standard: {
    name: 'The Standard',
    pattern: 'I-V-vi-IV',
    numerals: 'I - V - vi - IV',
    mood: ['uplifting', 'anthemic', 'energetic', 'hopeful'],
    genres: ['pop', 'rock', 'country', 'folk'],
    description: 'The most popular progression in modern music - uplifting and versatile',
  },
  the_doo_wop: {
    name: 'The Doo-Wop',
    pattern: 'I-vi-IV-V',
    numerals: 'I - vi - IV - V',
    mood: ['romantic', 'nostalgic', 'warm', 'tender'],
    genres: ['pop', 'soul', 'retro', 'rnb'],
    description: 'Classic 50s/60s progression - romantic and timeless',
  },
  the_sensitive: {
    name: 'The Sensitive',
    pattern: 'vi-IV-I-V',
    numerals: 'vi - IV - I - V',
    mood: ['emotional', 'vulnerable', 'melancholic', 'bittersweet'],
    genres: ['pop', 'punk', 'rock', 'emo'],
    description: 'Starting on minor creates emotional depth - perfect for ballads',
  },
  the_emotional_ballad: {
    name: 'The Emotional Ballad',
    pattern: 'vi-V-IV-V',
    numerals: 'vi - V - IV - V',
    mood: ['heartfelt', 'intimate', 'romantic', 'tender'],
    genres: ['pop', 'soul', 'rnb', 'country'],
    description: 'Tender progression for emotional storytelling',
  },
  the_canon: {
    name: 'The Canon',
    pattern: 'I-V-vi-iii',
    numerals: 'I - V - vi - iii',
    mood: ['cheerful', 'playful', 'nostalgic', 'uplifting'],
    genres: ['pop', 'rock', 'folk', 'classical'],
    description: 'Based on Pachelbel\'s Canon - elegant and flowing',
  },
  the_empowerment: {
    name: 'The Empowerment Anthem',
    pattern: 'IV-I-V-vi',
    numerals: 'IV - I - V - vi',
    mood: ['uplifting', 'powerful', 'triumphant', 'hopeful'],
    genres: ['pop', 'rock', 'country'],
    description: 'Starting on IV creates a lifting feeling - great for anthems',
  },
  the_rock_and_roll: {
    name: 'The Rock & Roll',
    pattern: 'I-IV-V',
    numerals: 'I - IV - V',
    mood: ['energetic', 'driving', 'fun', 'party'],
    genres: ['rock', 'blues', 'country', 'punk'],
    description: 'The classic three-chord progression - raw and powerful',
  },
  the_jazz_pop: {
    name: 'The Jazz Pop',
    pattern: 'ii-V-I',
    numerals: 'ii - V - I',
    mood: ['smooth', 'sophisticated', 'warm', 'elegant'],
    genres: ['jazz', 'rnb', 'soul', 'lofi'],
    description: 'The essential jazz cadence - sophisticated and resolved',
  },
  the_turnaround: {
    name: 'The Turnaround',
    pattern: 'I-vi-ii-V',
    numerals: 'I - vi - ii - V',
    mood: ['romantic', 'nostalgic', 'smooth', 'warm'],
    genres: ['jazz', 'soul', 'retro', 'lofi'],
    description: 'Classic jazz turnaround - keeps the harmony moving',
  },
  the_plagal: {
    name: 'The Plagal',
    pattern: 'I-IV-I-V',
    numerals: 'I - IV - I - V',
    mood: ['hopeful', 'uplifting', 'spiritual', 'warm'],
    genres: ['gospel', 'country', 'folk', 'soul'],
    description: 'Church-like "Amen" cadence - spiritual and resolved',
  },
};

// Dark & Cinematic
export const DARK_PROGRESSIONS: Record<string, ChordProgression> = {
  the_andalusian: {
    name: 'The Andalusian',
    pattern: 'i-VII-VI-V',
    numerals: 'i - bVII - bVI - V',
    mood: ['dramatic', 'tense', 'passionate', 'exotic'],
    genres: ['cinematic', 'latin', 'metal', 'flamenco'],
    description: 'Spanish/Flamenco progression - dramatic and passionate',
  },
  the_phrygian: {
    name: 'The Phrygian',
    pattern: 'i-bII-i',
    numerals: 'i - bII - i',
    mood: ['ominous', 'tense', 'dark', 'exotic'],
    genres: ['metal', 'cinematic', 'electronic'],
    description: 'Phrygian mode movement - dark and mysterious',
  },
  the_dramatic_minor: {
    name: 'The Dramatic Minor',
    pattern: 'i-iv-V',
    numerals: 'i - iv - V',
    mood: ['dramatic', 'tense', 'passionate', 'intense'],
    genres: ['classical', 'cinematic', 'rock', 'metal'],
    description: 'Classic minor progression - dramatic tension and release',
  },
  the_creep: {
    name: 'The Creep',
    pattern: 'I-III-IV-iv',
    numerals: 'I - III - IV - iv',
    mood: ['melancholic', 'introspective', 'haunting', 'bittersweet'],
    genres: ['rock', 'alternative', 'indie'],
    description: 'Major to borrowed minor iv - haunting and memorable',
  },
  the_minor_pop: {
    name: 'The Minor Pop',
    pattern: 'i-VI-V-i',
    numerals: 'i - bVI - V - i',
    mood: ['powerful', 'dramatic', 'dark', 'emotional'],
    genres: ['pop', 'electronic', 'rock'],
    description: 'Minor key with strong resolution - dark but catchy',
  },
  the_sad_loop: {
    name: 'The Sad Loop',
    pattern: 'i-VI-i-VII',
    numerals: 'i - bVI - i - bVII',
    mood: ['melancholic', 'brooding', 'haunting', 'numb'],
    genres: ['trap', 'rnb', 'electronic', 'lofi'],
    description: 'Hypnotic minor loop - modern and melancholic',
  },
  the_suspense: {
    name: 'The Suspense',
    pattern: 'V-VI-V-VI',
    numerals: 'V - bVI - V - bVI',
    mood: ['tense', 'ominous', 'building', 'suspenseful'],
    genres: ['cinematic', 'electronic', 'ambient'],
    description: 'Tension-building oscillation - perfect for suspense',
  },
  the_picardy: {
    name: 'The Picardy',
    pattern: 'i-VII-VI-I',
    numerals: 'i - bVII - bVI - I',
    mood: ['bittersweet', 'hopeful', 'triumphant', 'resolving'],
    genres: ['classical', 'cinematic', 'rock'],
    description: 'Minor to major resolution - dark journey to light',
  },
};

// Jazz & Soul
export const JAZZ_PROGRESSIONS: Record<string, ChordProgression> = {
  the_two_five_one: {
    name: 'The 2-5-1',
    pattern: 'ii-V-I',
    numerals: 'ii7 - V7 - Imaj7',
    mood: ['smooth', 'sophisticated', 'warm', 'resolved'],
    genres: ['jazz', 'soul', 'rnb', 'lofi'],
    description: 'The cornerstone of jazz harmony - smooth and sophisticated',
  },
  the_soul_vamp: {
    name: 'The Soul Vamp',
    pattern: 'i-IV',
    numerals: 'i7 - IV7',
    mood: ['groovy', 'hypnotic', 'soulful', 'warm'],
    genres: ['soul', 'funk', 'rnb', 'jazz'],
    description: 'Two-chord soul groove - hypnotic and timeless',
  },
  the_minor_plagal: {
    name: 'The Minor Plagal',
    pattern: 'IV-iv-I',
    numerals: 'IV - iv - I',
    mood: ['melancholic', 'beautiful', 'bittersweet', 'emotional'],
    genres: ['jazz', 'soul', 'pop', 'rock'],
    description: 'Major IV to minor iv - beautiful melancholy',
  },
  the_blues: {
    name: 'The Blues',
    pattern: 'I-IV-I-V',
    numerals: 'I7 - IV7 - I7 - V7',
    mood: ['soulful', 'gritty', 'emotional', 'groovy'],
    genres: ['blues', 'jazz', 'rock', 'soul'],
    description: 'Essential blues changes - raw and expressive',
  },
  the_neo_soul: {
    name: 'The Neo-Soul Walk',
    pattern: 'I-iii-IV-V',
    numerals: 'Imaj7 - iii7 - IVmaj7 - V7',
    mood: ['smooth', 'romantic', 'warm', 'uplifting'],
    genres: ['rnb', 'soul', 'jazz', 'lofi'],
    description: 'Smooth walking progression - modern soul classic',
  },
  the_gospel: {
    name: 'The Gospel Turn',
    pattern: 'I-IV-I-V',
    numerals: 'I - IV - I - V',
    mood: ['uplifting', 'joyful', 'spiritual', 'powerful'],
    genres: ['gospel', 'soul', 'rnb'],
    description: 'Church progression with gospel voicings - uplifting and spiritual',
  },
  the_smooth: {
    name: 'The Smooth Operator',
    pattern: 'i-iv-v',
    numerals: 'i7 - iv7 - v7',
    mood: ['smooth', 'sultry', 'intimate', 'sophisticated'],
    genres: ['jazz', 'rnb', 'lofi', 'soul'],
    description: 'Minor smooth jazz vamp - intimate and seductive',
  },
  the_bossa: {
    name: 'The Bossa Nova',
    pattern: 'Imaj7-ii7-V7-Imaj7',
    numerals: 'Imaj7 - ii7 - V7 - Imaj7',
    mood: ['relaxed', 'romantic', 'breezy', 'warm'],
    genres: ['jazz', 'latin', 'lofi'],
    description: 'Brazilian jazz harmony - relaxed and romantic',
  },
  the_lydian: {
    name: 'The Lydian Dream',
    pattern: 'Imaj7#11-II7',
    numerals: 'Imaj7#11 - II7',
    mood: ['dreamy', 'floating', 'ethereal', 'wonder'],
    genres: ['jazz', 'ambient', 'cinematic', 'electronic'],
    description: 'Lydian color - dreamy and floating',
  },
};

// All progressions combined
export const ALL_PROGRESSIONS: Record<string, ChordProgression> = {
  ...POP_PROGRESSIONS,
  ...DARK_PROGRESSIONS,
  ...JAZZ_PROGRESSIONS,
};

// Genre to progression mapping
export const GENRE_PROGRESSIONS: Record<string, readonly string[]> = {
  jazz: ['the_two_five_one', 'the_turnaround', 'the_bossa', 'the_soul_vamp', 'the_smooth', 'the_lydian'],
  pop: ['the_standard', 'the_sensitive', 'the_doo_wop', 'the_empowerment', 'the_canon'],
  rock: ['the_rock_and_roll', 'the_standard', 'the_creep', 'the_sensitive', 'the_dramatic_minor'],
  electronic: ['the_minor_pop', 'the_sad_loop', 'the_suspense', 'the_phrygian'],
  rnb: ['the_two_five_one', 'the_neo_soul', 'the_soul_vamp', 'the_doo_wop', 'the_smooth'],
  soul: ['the_soul_vamp', 'the_gospel', 'the_blues', 'the_neo_soul', 'the_two_five_one'],
  blues: ['the_blues', 'the_rock_and_roll', 'the_soul_vamp', 'the_dramatic_minor'],
  country: ['the_standard', 'the_rock_and_roll', 'the_plagal', 'the_doo_wop'],
  folk: ['the_standard', 'the_canon', 'the_plagal', 'the_rock_and_roll'],
  classical: ['the_dramatic_minor', 'the_picardy', 'the_canon', 'the_andalusian'],
  cinematic: ['the_andalusian', 'the_suspense', 'the_picardy', 'the_dramatic_minor', 'the_lydian'],
  ambient: ['the_lydian', 'the_suspense', 'the_minor_plagal', 'the_sad_loop'],
  lofi: ['the_two_five_one', 'the_smooth', 'the_neo_soul', 'the_sad_loop', 'the_bossa'],
  metal: ['the_phrygian', 'the_andalusian', 'the_dramatic_minor', 'the_minor_pop'],
  punk: ['the_rock_and_roll', 'the_sensitive', 'the_standard'],
  trap: ['the_sad_loop', 'the_minor_pop', 'the_phrygian'],
  latin: ['the_andalusian', 'the_bossa', 'the_two_five_one'],
  retro: ['the_doo_wop', 'the_turnaround', 'the_rock_and_roll', 'the_standard'],
  synthwave: ['the_minor_pop', 'the_sad_loop', 'the_standard', 'the_sensitive'],
  videogame: ['the_lydian', 'the_standard', 'the_dramatic_minor', 'the_picardy'],
  symphonic: ['the_dramatic_minor', 'the_picardy', 'the_andalusian', 'the_empowerment'],
};

// Get suggested progressions for a genre
export function getProgressionsForGenre(genre: string): ChordProgression[] {
  const progressionKeys = GENRE_PROGRESSIONS[genre.toLowerCase()] ?? GENRE_PROGRESSIONS.pop ?? [];
  return progressionKeys
    .map(key => ALL_PROGRESSIONS[key])
    .filter((p): p is ChordProgression => p !== undefined);
}

// Default progression for fallback
const DEFAULT_PROGRESSION: ChordProgression = {
  name: 'The Standard',
  pattern: 'I-V-vi-IV',
  numerals: 'I - V - vi - IV',
  mood: ['uplifting', 'anthemic'],
  genres: ['pop', 'rock'],
  description: 'The most popular progression in modern music',
};

// Get a random progression for a genre
export function getRandomProgressionForGenre(
  genre: string,
  rng: () => number = Math.random
): ChordProgression {
  const progressions = getProgressionsForGenre(genre);
  if (progressions.length === 0) return DEFAULT_PROGRESSION;
  const idx = Math.floor(rng() * progressions.length);
  return progressions[idx] ?? DEFAULT_PROGRESSION;
}

// Build chord progression descriptor string (full format with description)
export function buildProgressionDescriptor(
  genre: string,
  rng: () => number = Math.random
): string {
  const progression = getRandomProgressionForGenre(genre, rng);
  return `${progression.name} (${progression.pattern}): ${progression.description}`;
}

// Build short chord progression string for instruments field (name + pattern only)
export function buildProgressionShort(
  genre: string,
  rng: () => number = Math.random
): string {
  const progression = getRandomProgressionForGenre(genre, rng);
  return `${progression.name} (${progression.pattern})`;
}

type ProgressionPattern = {
  readonly keywords: readonly string[];
  readonly progressionKey: string;
};

const PROGRESSION_PATTERNS: readonly ProgressionPattern[] = [
  { keywords: ['2-5-1', 'ii-v-i', 'two five one'], progressionKey: 'the_two_five_one' },
  { keywords: ['andalusian', 'flamenco'], progressionKey: 'the_andalusian' },
  { keywords: ['doo-wop', 'doo wop'], progressionKey: 'the_doo_wop' },
  { keywords: ['i-v-vi-iv', 'four chord'], progressionKey: 'the_standard' },
  { keywords: ['blues progression', '12 bar', 'twelve bar'], progressionKey: 'the_blues' },
  { keywords: ['bossa nova', 'bossa'], progressionKey: 'the_bossa' },
  { keywords: ['lydian'], progressionKey: 'the_lydian' },
  { keywords: ['phrygian'], progressionKey: 'the_phrygian' },
] as const;

// Detect if description mentions a specific progression
export function detectProgression(description: string): ChordProgression | null {
  const lower = description.toLowerCase();
  
  for (const pattern of PROGRESSION_PATTERNS) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return ALL_PROGRESSIONS[pattern.progressionKey] ?? null;
    }
  }
  
  return null;
}

/** Check if prompt already contains a chord progression harmony tag */
function hasChordProgression(prompt: string): boolean {
  return /\([IViv\d\-#maj]+\)\s*harmony/i.test(prompt);
}

/**
 * Inject chord progression into instruments field if not already present.
 * Only applies to max mode format (quoted instruments field).
 */
export function injectChordProgression(
  prompt: string,
  genre: string,
  rng: () => number = Math.random
): string {
  if (hasChordProgression(prompt)) {
    return prompt;
  }

  const progression = getRandomProgressionForGenre(genre, rng);
  const harmonyTag = `${progression.name} (${progression.pattern}) harmony`;

  const quotedMatch = prompt.match(/^(instruments:\s*")([^"]*)"/mi);
  if (quotedMatch) {
    const existing = quotedMatch[2]?.trim();
    const newValue = existing ? `${existing}, ${harmonyTag}` : harmonyTag;
    return prompt.replace(/^(instruments:\s*")[^"]*"/mi, `$1${newValue}"`);
  }

  return prompt;
}
